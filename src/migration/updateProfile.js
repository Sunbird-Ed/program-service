const _ = require("lodash");
const PromisePool = require('@supercharge/promise-pool')
const Sequelize = require('sequelize');
const model = require('../models');
const axios = require('axios');
const envVariables = require('../envVariables');
const RegistryService = require('../service/registryService');
const registryService = new RegistryService();
const registryUrl = envVariables['OPENSABER_SERVICE_URL']
const failedUpdateUsersId = [];

async function updateUsersProfiles() {
    const nominations =  await model.nomination.findAll({
        attributes:[
            'user_id',
            [Sequelize.fn('array_agg', Sequelize.col('program_id')), 'program_id']
        ],
        group:['user_id']
    });

    const { results, errors } = await PromisePool
    .withConcurrency(10)
    .for(nominations)
    .process(async nomination => {
        const user = await updateUser(nomination);
        return user
    });

    console.log(results);
}

async function updateUser(nomination) {
    try {
        const res = await getUserDetails(nomination.user_id);
        if (res.data.result.User.length) {
            const userDetails = _.first(res.data.result.User);
            return await updateMSG(userDetails, nomination.program_id)
        }
    }
    catch(err) {
        failedUpdateUsersId.push(nomination.user_id);
        console.log(err);
    }
}

async function getUserDetails(user_id) {
    const option = {
        url: registryUrl+'/search',
        method: 'post',
        headers: {...registryService.getDefaultHeaders()},
        data: {
            "id": "open-saber.registry.search",
            "request": {
                "entityType":["User"],
                "filters": {
                    "userId": {
                        "contains": user_id
                    }
                }
            }
        }
    };
    return axios(option);
}

async function updateMSG(user, program_id) {
    const msg = { medium: [], subject: [], gradeLevel: []};
    const programs = await model.program.findAll({
        required: true,
        attributes: {
            include: [[Sequelize.json('config.subject'), 'subject'], [Sequelize.json('config.gradeLevel'), 'gradeLevel'], [Sequelize.json('config.medium'), 'medium']],
            exclude: ['program_id', 'name', 'type', 'collection_ids', 'content_types', 'startdate', 'enddate', 'nomination_enddate', 'shortlisting_enddate', 'content_submission_enddate', 'image', 'status', 'slug', 'rolemapping', 'createdby', 'updatedby', 'createdon', 'updatedon', 'rootorg_id', 'sourcing_org_name', 'channel', 'template_id', 'guidelines_url','config', 'description'],
        },
        where: {
            'program_id': program_id
        }
    });
    _.each(programs, prg => {
        msg.medium = _.union(msg.medium, JSON.parse(prg.dataValues.medium));
        msg.subject = _.union(msg.subject, JSON.parse(prg.dataValues.subject));
        msg.gradeLevel = _.union(msg.gradeLevel, JSON.parse(prg.dataValues.gradeLevel));
    });

    const option = {
        url: registryUrl+'/update',
        method: 'post',
        headers: {...registryService.getDefaultHeaders()},
        data: {
            "id": "open-saber.registry.update",
            "ver": "1.0",
            "request": {
            "User": {
                "osid": user.osid,
                "medium": _.union(user.medium, msg.medium),
                "gradeLevel": _.union(user.gradeLevel, msg.gradeLevel),
                "subject": _.union(user.subject, msg.subject)
                }
            }
        }
    };

    return axios(option);
}

updateUsersProfiles()
.then( res => {
    if (failedUpdateUsersId.length) {
        console.log("*********** Update failed for these users ids **** \n", failedUpdateUsersId);
    }
}).catch(err => {
    console.log(err);
});

