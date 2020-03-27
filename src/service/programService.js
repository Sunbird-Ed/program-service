const _ = require("lodash");
const uuid = require("uuid/v1");
const logger = require('sb_logger_util_v2');
const messageUtils = require('./messageUtil');
const respUtil = require('response_util');
const Sequelize = require('sequelize');
const responseCode = messageUtils.RESPONSE_CODE;
const programMessages = messageUtils.PROGRAM;
const contentTypeMessages = messageUtils.CONTENT_TYPE;
const model = require('../models');
const {
  forkJoin
} = require('rxjs');
const axios = require('axios');
const envVariables = require('../envVariables');
const RegistryService = require('./registryService')
var async = require('async')


const queryRes_Max = 500;
const queryRes_Min = 100;
const HierarchyService = require('../helpers/updateHierarchy.helper');

const registryService = new RegistryService()
const hierarchyService = new HierarchyService()

function getProgram(req, response) {
  model.program.findOne({
      where: {
        program_id: req.params.program_id
      }
    })
    .then(function (res) {
      return response.status(200).send(successResponse({
        apiId: 'api.program.read',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'OK',
        result: res
      }))
    })
    .catch(function (err) {
      return response.status(400).send(errorResponse({
        apiId: 'api.program.read',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_READ_PROGRAM',
        result: err
      }));
    });
}

async function createProgram(req, response) {
  var data = req.body
  var rspObj = req.rspObj
  if (!data.request || !data.request.config || !data.request.type) {
    rspObj.errCode = programMessages.CREATE.MISSING_CODE
    rspObj.errMsg = programMessages.CREATE.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request config or request rootOrgId or request type',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }
  const insertObj = req.body.request;
  insertObj.program_id = uuid();
  insertObj.config = insertObj.config ? JSON.stringify(insertObj.config) : "";
  if (req.body.request.enddate) {
    insertObj.enddate = req.body.request.enddate
  }

  model.program.create(insertObj).then(sc => {
    console.log("Program successfully written to DB", sc);
    return response.status(200).send(successResponse({
      apiId: 'api.program.create',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'OK',
      result: {
        'program_id': insertObj.program_id
      }
    }));
  }).catch(err => {
    console.log("Error adding Program to db", err);
    return response.status(400).send(errorResponse({
      apiId: 'api.program.create',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'ERR_CREATE_PROGRAM',
      result: err
    }));
  });
}

function updateProgram(req, response) {
  var data = req.body
  var rspObj = req.rspObj
  if (!data.request || !data.request.program_id) {
    rspObj.errCode = programMessages.UPDATE.MISSING_CODE
    rspObj.errMsg = programMessages.UPDATE.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request program_id',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }
  const updateQuery = {
    where: {
      program_id: data.request.program_id
    }
  };
  const updateValue = _.cloneDeep(req.body.request);
  if (!updateValue.updatedon) {
    updateValue.updatedon = new Date();
  }
  if (updateValue.config) {
    updateValue.config = JSON.stringify(updateValue.config);
  }
  model.program.update(updateValue, updateQuery).then(resData => {
    if (_.isArray(resData) && !resData[0]) {
      return response.status(400).send(errorResponse({
        apiId: 'api.program.update',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_UPDATE_PROGRAM',
        result: 'Program_id Not Found'
      }));
    }
    return response.status(200).send(successResponse({
      apiId: 'api.program.update',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'OK',
      result: {
        'program_id': updateQuery.where.program_id
      }
    }));
  }).catch(error => {
    return response.status(400).send(errorResponse({
      apiId: 'api.program.update',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'ERR_UPDATE_PROGRAM',
      result: error
    }));
  });
}

async function deleteProgram(req, response) {
  var data = req.body
  var rspObj = req.rspObj
  if (!data.request || !data.request.program_id) {
    rspObj.errCode = programMessages.READ.MISSING_CODE
    rspObj.errMsg = programMessages.READ.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request config or request rootOrgId or request type',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }
  const deleteQuery = {
    program_id: req.body.request.program_id
  };
  programDBModel.instance.program.deleteAsync(deleteQuery).then(resData => {
    return response.status(200).send(successResponse({
      apiId: 'api.program.delete',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'OK',
      result: {
        'program_id': deleteQuery.program_id
      }
    }));
  }).catch(error => {
    console.log('ERRor in deleteAsync ', error);
    return response.status(400).send(errorResponse({
      apiId: 'api.program.delete',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'ERR_DELETE_PROGRAM',
      result: error
    }));
  });
}

function programList(req, response) {
  var data = req.body
  var rspObj = req.rspObj
  var res_limit = queryRes_Min;
  if (!data.request || !data.request.filters) {
    rspObj.errCode = programMessages.READ.MISSING_CODE
    rspObj.errMsg = programMessages.READ.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request.filters',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }
  if (data.request.limit) {
    res_limit = (data.request.limit < queryRes_Max) ? data.request.limit : (queryRes_Max);
  }
  if (data.request.filters && data.request.filters.enrolled_id) {
    if (!data.request.filters.enrolled_id.user_id) {
      rspObj.errCode = programMessages.READ.MISSING_CODE
      rspObj.errMsg = programMessages.READ.MISSING_MESSAGE
      rspObj.responseCode = responseCode.CLIENT_ERROR
      logger.error({
        msg: 'Error due to missing request.filters.enrolled_id.user_id',
        err: {
          errCode: rspObj.errCode,
          errMsg: rspObj.errMsg,
          responseCode: rspObj.responseCode
        },
        additionalInfo: {
          data
        }
      }, req)
      return response.status(400).send(errorResponse(rspObj))
    }
    model.nomination.findAndCountAll({
        where: {
          user_id: data.request.filters.enrolled_id.user_id
        },
        limit: res_limit,
        include: [{
          model: model.program
        }]
      })
      .then((prg_list) => {
        return response.status(200).send(successResponse({
          apiId: 'api.program.list',
          ver: '1.0',
          msgid: uuid(),
          responseCode: 'OK',
          result: {
            count: prg_list.count,
            programs: prg_list.rows
          }
        }))
      })
      .catch(function (err) {
        return response.status(400).send(errorResponse({
          apiId: 'api.program.list',
          ver: '1.0',
          msgid: uuid(),
          responseCode: 'ERR_LIST_PROGRAM',
          result: err
        }));
      });
  } else {
    model.program.findAndCountAll({
        where: {
          ...data.request.filters
        },
        limit: res_limit,
        order: [
          ['updatedon', 'DESC']
        ]
      })
      .then(function (res) {
        return response.status(200).send(successResponse({
          apiId: 'api.program.list',
          ver: '1.0',
          msgid: uuid(),
          responseCode: 'OK',
          result: {
            count: res.count,
            programs: res.rows
          }
        }))
      })
      .catch(function (err) {
        return response.status(400).send(errorResponse({
          apiId: 'api.program.list',
          ver: '1.0',
          msgid: uuid(),
          responseCode: 'ERR_LIST_PROGRAM',
          result: err
        }));
      });
  }
}

function addNomination(req, response) {
  var data = req.body
  var rspObj = req.rspObj
  if (!data.request || !data.request.program_id || !data.request.user_id || !data.request.status) {
    rspObj.errCode = programMessages.NOMINATION.CREATE.MISSING_CODE
    rspObj.errMsg = programMessages.NOMINATION.CREATE.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request program_id or request user_id or request status',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }
  const insertObj = req.body.request;

  model.nomination.create(insertObj).then(res => {
    console.log("nomination successfully written to DB", res);
    return response.status(200).send(successResponse({
      apiId: 'api.nomination.add',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'OK',
      result: {
        'program_id': insertObj.program_id,
        'user_id': insertObj.user_id,
        'id': res.dataValues.id
      }
    }));
  }).catch(err => {
    console.log("Error adding nomination to db", err);
    return response.status(400).send(errorResponse({
      apiId: 'api.nomination.add',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'ERR_CREATE_PROGRAM',
      result: err
    }));
  });
}

function updateNomination(req, response) {
  var data = req.body
  var rspObj = req.rspObj
  if (!data.request || !data.request.program_id || !data.request.user_id) {
    rspObj.errCode = programMessages.NOMINATION.UPDATE.MISSING_CODE
    rspObj.errMsg = programMessages.NOMINATION.UPDATE.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request config or request rootOrgId or request type',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }
  const updateQuery = {
    where: {
      program_id: data.request.program_id,
      user_id: data.request.user_id
    }
  };
  const updateValue = req.body.request;
  if (!updateValue.updatedon) {
    updateValue.updatedon = new Date();
  }
  model.nomination.update(updateValue, updateQuery).then(res => {
    if (_.isArray(res) && !res[0]) {
      return response.status(400).send(errorResponse({
        apiId: 'api.nomination.update',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_UPDATE_NOMINATION',
        result: 'Nomination Not Found'
      }));
    }
    return response.status(200).send(successResponse({
      apiId: 'api.nomination.update',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'OK',
      result: {
        'program_id': updateQuery.where.program_id,
        'user_id': updateQuery.where.user_id
      }
    }));
  }).catch(err => {
    console.log("Error updating nomination to db", err);
    return response.status(400).send(errorResponse({
      apiId: 'api.nomination.update',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'ERR_UPDATE_NOMINATION',
      result: err
    }));
  });
}

function removeNomination(req, response) {
  console.log(req)
}

function getNominationsList(req, response) {
  var data = req.body;
  var rspObj = req.rspObj;
  var res_limit = queryRes_Min;
  if (data.request.limit) {
    res_limit = (data.request.limit < queryRes_Max) ? data.request.limit : (queryRes_Max);
  }
  const findQuery = data.request.filters ? data.request.filters : {}
  if (data.request.facets) {
    const facets = data.request.facets;
    model.nomination.findAll({
      where: {
        ...findQuery
      },
      attributes: [...facets, [Sequelize.fn('count', Sequelize.col(facets[0])), 'count']],
      group: [...facets]
    }).then((result) => {
      return response.status(200).send(successResponse({
        apiId: 'api.nomination.list',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'OK',
        result: result
      }))
    }).catch((err) => {
      return response.status(400).send(errorResponse({
        apiId: 'api.nomination.list',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_NOMINATION_LIST',
        result: err
      }));
    })
  } else {
    model.nomination.findAll({
      where: {
        ...findQuery
      },
      limit: res_limit,
      order: [
        ['updatedon', 'DESC']
      ]
    }).then(async function (result) {
      try {
        var userList = [];
        _.forEach(result, function (data) {
          userList.push(data.user_id);
        })
        if (_.isEmpty(userList)) {
          return response.status(200).send(successResponse({
            apiId: 'api.nomination.list',
            ver: '1.0',
            msgid: uuid(),
            responseCode: 'OK',
            result: result
          }))
        }
        const userMap = _.map(userList, user => {
          return getUsersDetails(req, user);
        })
        forkJoin(...userMap).subscribe(resData => {
          _.forEach(resData, function (data, index) {
            if (data.data.result) {
              result[index].dataValues.userData = data.data.result.User[0];
            }
          });
          return response.status(200).send(successResponse({
            apiId: 'api.nomination.list',
            ver: '1.0',
            msgid: uuid(),
            responseCode: 'OK',
            result: result
          }))
        }, (error) => {
          return response.status(400).send(errorResponse({
            apiId: 'api.nomination.list',
            ver: '1.0',
            msgid: uuid(),
            responseCode: 'ERR_NOMINATION_LIST',
            result: error
          }));
        });
      } catch (err) {
        return response.status(400).send(errorResponse({
          apiId: 'api.nomination.list',
          ver: '1.0',
          msgid: uuid(),
          responseCode: 'ERR_NOMINATION_LIST',
          result: err.message || err
        }));
      }
    }).catch(function (err) {
      return response.status(400).send(errorResponse({
        apiId: 'api.nomination.list',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_NOMINATION_LIST',
        result: err.message || err
      }));
    });
  }
}

function getUsersDetails(req, userId) {
  const url = `${envVariables.baseURL}/content/reg/search`;
  const reqData = {
    "id": "open-saber.registry.search",
    "ver": "1.0",
    "ets": "11234",
    "params": {
      "did": "",
      "key": "",
      "msgid": ""
    },
    "request": {
      "entityType": ["User"],
      "filters": {
        "userId": {
          "eq": userId
        }
      }
    }
  }
  return axios({
    method: 'post',
    url: url,
    headers: req.headers,
    data: reqData
  });
}


function getUsersDetailsById(req, response) {

  const dikshaUserId = req.params.user_id
  async.waterfall([
    function (callback1) {
      getUserDetailsFromRegistry(dikshaUserId, callback1)
    },
    function (user, callback2) {
      getUserOrgMappingDetailFromRegistry(user, callback2);
    },
    function (user, userOrgMapDetails, callback3) {
      getOrgDetailsFromRegistry(user, userOrgMapDetails, callback3)
    },
    function (user, userOrgMapDetails, orgInfoLists, callback4) {
      createUserRecords(user, userOrgMapDetails, orgInfoLists, callback4)
    }
  ], function (err, res) {
    if (err) {
      return response.status(400).send(errorResponse({
        apiId: 'api.user.read',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_READ_USER',
        result: err.message || err
      }))

    } else {
      return response.status(200).send(successResponse({
        apiId: 'api.user.read',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'OK',
        result: res
      }))
    }
  });
}

function getUserDetailsFromRegistry(value, callback) {
  let userDetailReq = {
    body: {
      id: "open-saber.registry.search",
      request: {
        entityType: ["User"],
        filters: {
          userId: {
            eq: value
          }
        }

      }
    }
  }

  registryService.searchRecord(userDetailReq, (err, res) => {
    if (res) {
      if (res.status == 200) {
        if (res.data.result.User.length > 0) {
          var userDetails = res.data.result.User[0];
          callback(null, userDetails)
        } else {
          callback("user does not exist")
        }
      } else {
        logger.error("Encounted some error while searching data")
        callback("Encounted some error while searching data")
      }
    } else {
      logger.error("Encounted some error while searching data")
      callback("Encounted some error while searching data")
    }
  });

}


function getUserOrgMappingDetailFromRegistry(user, callback) {

  let userOrgMappingReq = {
    body: {
      id: "open-saber.registry.search",
      request: {
        entityType: ["User_Org"],
        filters: {
          userId: {
            eq: user.osid
          }
        }

      }
    }
  }

  registryService.searchRecord(userOrgMappingReq, (err, res) => {
    if (res) {
      if (res.status == 200) {
        if (res.data.result.User_Org.length > 0) {
          userOrgMapList = res.data.result.User_Org
          callback(null, user, userOrgMapList)
        } else {
          callback("Org not mapped to the user: " + user.userId)
        }
      } else {
        logger.error("Encounted some error while searching data")
        callback("Encounted some error while searching data")
      }
    } else {
      logger.error("Encounted some error while searching data")
      callback("Encounted some error while searching data")
    }
  });

}

function getOrgDetailsFromRegistry(user, userOrgMapDetails, callback) {

  const orgList = userOrgMapDetails.map((value) => value.orgId.slice(2))

  let orgDetailsReq = {
    body: {
      id: "open-saber.registry.search",
      request: {
        entityType: ["Org"],
        filters: {
          osid: {
            or: orgList
          }
        }

      }
    }
  }

  registryService.searchRecord(orgDetailsReq, (err, res) => {
    if (res) {
      if (res.status == 200) {
        if (res.data.result.Org.length > 0) {
          orgInfoList = res.data.result.Org
          callback(null, user, userOrgMapList, orgInfoList)
        } else {
          callback("Org Details Not available with org Ids: " + orgList.toString())
        }
      } else {
        logger.error("Encounted some error while searching data")
        callback("Encounted some error while searching data")
      }
    } else {
      logger.error("Encounted some error while searching data")
      callback("Encounted some error while searching data")
    }
  });

}

function createUserRecords(user, userOrgMapDetails, orgInfoList, callback) {

  try {
    orgInfoList.map((org) => {
      var roles = null
      userOrgMapDetails.forEach(function (element, index, array) {
        if (org.osid === element.orgId) {
          roles = element.roles;
        }
      });

      org['roles'] = roles

    });

    user['orgs'] = orgInfoList
    callback(null, user)

  } catch (e) {
    logger.error("Error while parsing for user lists")
    callback("Some Internal processing error while parsing user details", null)
  }


}

function addUserToRegistry(reqObj, callback) {

  let addUserReq = {
    body: {
      id: "open-saber.registry.create",
      request: {
        User: reqObj.User
      }
    }
  }

  registryService.addRecord(addUserReq, (err, res) => {
    if (res) {
      if (res.status == 200) {
        if(res.data.params.status=='SUCCESSFUL'){
             let user = res.data.result 
             callback(null,reqObj,user)
        }else{
          logger.error("Failied to add user")
          callback("Failed to add user")
        }
      } else {
        logger.error("Encounted some error while adding user")
        callback("Encounted some error while adding user")
      }
    }
  });

}

function mapUserToOrg(reqObj,userObj, callback) {

  let userOrgObj ={
    orgId: reqObj.orgId,
    userId: userObj.User.osid,
    roles: reqObj.roles
  }
  let mapReq = {
    body: {
      id: "open-saber.registry.create",
      request: {
        User_Org:userOrgObj
      }
    }
  }

  registryService.addRecord(mapReq, (err, res) => {
    if (res) {
      if (res.status == 200) {
        if(res.data.params.status=='SUCCESSFUL'){
              
             callback(null,userObj)
        }else{
          logger.error("Failied to map user to org")
          callback("Failed to map user to org")
        }
      } else {
        logger.error("Encounted some error while map user to org")
        callback("Encounted some error while map user to org")
      }
    }
  });

}


function addUserToOrgRegistry(req, response) {
  var data = req.body
  var rspObj = req.rspObj
  if (!data.request || !data.request.User || !data.request.User.userId || !data.request.User.firstName) {
      rspObj.errCode = programMessages.USER.ADD.MISSING_CODE
      rspObj.errMsg = programMessages.USER.ADD.MISSING_MESSAGE
      rspObj.responseCode = responseCode.CLIENT_ERROR
      logger.error({
        msg: 'Error due to missing request or request firstname or request user_id',
        err: {
          errCode: rspObj.errCode,
          errMsg: rspObj.errMsg,
          responseCode: rspObj.responseCode
        },
        additionalInfo: {
          data
        }
      }, req)
      return response.status(400).send(errorResponse(rspObj))
   }
   const insertObj = req.body.request;

   async.waterfall([
    function (callback) {
      addUserToRegistry(insertObj, callback)
    },
    function (insertObj,user, callback) {
      mapUserToOrg(insertObj,user, callback);
    }
  ], function (err, res) {
    if (err) {
      return response.status(400).send(errorResponse({
        apiId: 'api.user.add',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_ADD_USER',
        result: err.message || err
      }))

    } else {
      return response.status(200).send(successResponse({
        apiId: 'api.user.add',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'OK',
        result: res
      }))
    }
  });    

}



function programSearch(req, response) {
  const fieldsToSelect = _.compact(_.split(_.get(req, 'query.fields'), ','));
  console.log(fieldsToSelect)
  const requiredKeys = ['program_id', 'type', 'name', 'description', 'image_path']
  const searchCriteria = _.uniq([...requiredKeys, ...fieldsToSelect]);
  console.log(searchCriteria)
  const searchQuery = _.get(req, 'body.request');
  console.log(searchQuery)
  programDBModel.instance.program.findAsync(searchQuery, {
      allow_filtering: true,
      select: searchCriteria,
      raw: true
    })
    .then(resData => {
      return response.status(200).send(successResponse({
        apiId: 'api.program.search',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'OK',
        result: resData
      }));
    }).catch(error => {
      return response.status(400).send(errorResponse({
        apiId: 'api.program.search',
        ver: '1.0',
        msgid: uuid(),
        responseCode: 'ERR_SEARCH_PROGRAM',
        result: error.message || error
      }));
    })
}

function getProgramContentTypes(req, response) {
  var rspObj = req.rspObj;
  rspObj.errCode = contentTypeMessages.FETCH.FAILED_CODE
  rspObj.errMsg = contentTypeMessages.FETCH.FAILED_MESSAGE
  rspObj.responseCode = responseCode.SERVER_ERROR
  logger.debug({
    msg: 'Request to program to fetch content types'
  }, req)
  model.contenttypes.findAndCountAll()
    .then(res => {
      rspObj.result = {
        count: res.count,
        contentType: res.rows
      }
      rspObj.responseCode = 'OK'
      return response.status(200).send(successResponse(rspObj))
    }).catch(error => {
      logger.error({
        msg: 'Error fetching program content types',
        err: {
          errCode: rspObj.errCode,
          errMsg: rspObj.errMsg,
          responseCode: rspObj.responseCode
        },
        additionalInfo: {
          error
        }
      }, req)
      return response.status(400).send(errorResponse(rspObj));
    })
}

function programUpdateCollection(req, response) {
  const data = req.body
  const rspObj = req.rspObj
  const url = `${envVariables.SUNBIRD_URL}/action/system/v3/content/update`;
  if (!data.request || !data.request.program_id || !data.request.collection) {
    rspObj.errCode = programMessages.LINK.MISSING_CODE
    rspObj.errMsg = programMessages.LINK.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request program_id or request collections',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }

  const updateQuery = {
    "request": {
      "content": {
        "programId": req.body.request.program_id
      }
    }
  }

  const updateUrls = _.map(req.body.request.collection, collection => {
    return axios({
      method: 'patch',
      url: `${url}/${collection}`,
      headers: req.headers,
      data: updateQuery
    });
  })
  forkJoin(updateUrls).subscribe(resData => {
    const consolidatedResult = _.map(resData, r => r.data.result)
    return response.status(200).send(successResponse({
      apiId: 'api.program.collection.link',
      ver: '1.0',
      msgid: uuid(),
      responseCode: 'OK',
      result: consolidatedResult
    }));
  }, (error) => {
    rspObj.errCode = programMessages.LINK.MISSING_CODE
    rspObj.errMsg = programMessages.LINK.MISSING_MESSAGE
    rspObj.responseCode = responseCode.RESOURCE_NOT_FOUND
    logger.error({
      msg: 'Error due to resource not found',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)

    return response.status(400).send(errorResponse({
      apiId: 'api.program.collection.link',
      ver: '1.0',
      msgId: uuid(),
      errCode: error.response.data.params.err,
      status: error.response.data.params.status,
      errMsg: error.response.data.params.errmsg,
      responseCode: error.response.data.responseCode,
      result: error.response.data.result
    }));
  })
}

async function programCopyCollections(req, response) {
  const data = req.body;
  const rspObj = req.rspObj;
  const reqHeaders = req.headers;

  if (!data.request || !data.request.program_id || !data.request.collections || !data.request.allowed_content_types || !data.request.channel) {
    rspObj.errCode = programMessages.COPY_COLLECTION.COPY.MISSING_CODE
    rspObj.errMsg = programMessages.COPY_COLLECTION.COPY.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to missing request or request config or request rootOrgId or request type',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(errorResponse(rspObj))
  }

  const collections = _.get(data, 'request.collections');
  const programId = _.get(data, 'request.program_id');
  const allowedContentTypes = _.get(data, 'request.allowed_content_types');
  const channel = _.get(data, 'request.channel');
  const openForContribution = true;
  const additionalMetaData = {
    programId,
    allowedContentTypes,
    channel,
    openForContribution
  }
  hierarchyService.filterExistingTextbooks(collections, reqHeaders)
    .subscribe(
      (resData) => {
        const consolidatedResult = _.map(resData, r => {
          return {
            result: r.data.result,
            config: r.config.data
          }
        })
        const existingTextbooks = hierarchyService.getExistingCollection(consolidatedResult);
        const nonExistingTextbooks = hierarchyService.getNonExistingCollection(consolidatedResult)
        if (existingTextbooks && existingTextbooks.length > 0) {
          hierarchyService.getHierarchy(existingTextbooks, reqHeaders)
            .subscribe(
              (originHierarchyResult) => {
                const originHierarchyResultData = _.map(originHierarchyResult, r => {
                  return _.get(r, 'data')
                })
                const getCollectiveRequest = _.map(originHierarchyResultData, c => {
                  return hierarchyService.generateHierarchyUpdateRequest(c, additionalMetaData);
                })
                hierarchyService.bulkUpdateHierarchy(getCollectiveRequest, reqHeaders)
                  .subscribe(updateResult => {
                    const updateResultData = _.map(updateResult, obj => {
                      return obj.data
                    })
                    rspObj.result = updateResultData;
                    rspObj.responseCode = 'OK'
                    response.status(200).send(successResponse(rspObj))
                  }, error => {
                    rspObj.errCode = programMessages.COPY_COLLECTION.BULK_UPDATE_HIERARCHY.FAILED_CODE,
                    rspObj.errMsg = programMessages.COPY_COLLECTION.BULK_UPDATE_HIERARCHY.FAILED_MESSAGE,
                    rspObj.responseCode = responseCode.SERVER_ERROR
                    logger.error({
                      msg: 'Error updating hierarchy for collections',
                      err: {
                        errCode: rspObj.errCode,
                        errMsg: rspObj.errMsg,
                        responseCode: rspObj.responseCode
                      },
                      additionalInfo: {
                        error
                      }
                    }, req)
                    return response.status(400).send(errorResponse(rspObj))
                  })
              }, error => {
                rspObj.errCode = programMessages.COPY_COLLECTION.GET_HIERARCHY.FAILED_CODE,
                rspObj.errMsg = programMessages.COPY_COLLECTION.GET_HIERARCHY.FAILED_MESSAGE,
                rspObj.responseCode = responseCode.SERVER_ERROR
                logger.error({
                  msg: 'Error fetching hierarchy for collections',
                  err: {
                    errCode: rspObj.errCode,
                    errMsg: rspObj.errMsg,
                    responseCode: rspObj.responseCode
                  },
                  additionalInfo: {
                    error
                  }
                }, req)
                return response.status(400).send(errorResponse(rspObj))
              })
        }
        if (nonExistingTextbooks && nonExistingTextbooks.length > 0) {
          hierarchyService.getHierarchy(nonExistingTextbooks, reqHeaders)
            .subscribe(
              (originHierarchyResult) => {
                const originHierarchyResultData = _.map(originHierarchyResult, r => {
                  return _.get(r, 'data')
                })
                hierarchyService.createCollection(originHierarchyResultData, reqHeaders)
                  .subscribe(createResponse => {
                    const originHierarchy = _.map(originHierarchyResultData, 'result.content');

                    const createdCollections = _.map(createResponse, cr => {
                      const x = {
                        creationResult: cr.data,
                        hierarchy: {
                          ...JSON.parse(cr.config.data).request
                        },
                        originHierarchy: {
                          content: _.find(originHierarchy, {identifier: cr.config.params.identifier})
                        }
                      }
                      x.hierarchy.content.identifier = cr.config.params.identifier
                      return x;
                    })
                    console.log(createdCollections);
                    const getBulkUpdateRequest = _.map(createdCollections, item => {
                      return hierarchyService.getHierarchyUpdateRequest(item, additionalMetaData)
                    })
                    hierarchyService.bulkUpdateHierarchy(getBulkUpdateRequest, reqHeaders)
                      .subscribe(updateResult => {
                        const updateResultData = _.map(updateResult, obj => {
                          return obj.data
                        })
                        rspObj.result = updateResultData;
                        rspObj.responseCode = 'OK'
                        response.status(200).send(successResponse(rspObj))
                      }, error => {
                        rspObj.errCode = programMessages.COPY_COLLECTION.BULK_UPDATE_HIERARCHY.FAILED_CODE,
                          rspObj.errMsg = programMessages.COPY_COLLECTION.BULK_UPDATE_HIERARCHY.FAILED_MESSAGE,
                          rspObj.responseCode = responseCode.SERVER_ERROR
                        logger.error({
                          msg: 'Error updating hierarchy for collections',
                          err: {
                            errCode: rspObj.errCode,
                            errMsg: rspObj.errMsg,
                            responseCode: rspObj.responseCode
                          },
                          additionalInfo: {
                            error
                          }
                        }, req)
                        return response.status(400).send(errorResponse(rspObj))
                      })
                  }, error => {
                    rspObj.errCode = programMessages.COPY_COLLECTION.CREATE_COLLECTION.FAILED_CODE,
                      rspObj.errMsg = programMessages.COPY_COLLECTION.CREATE_COLLECTION.FAILED_MESSAGE,
                      rspObj.responseCode = responseCode.SERVER_ERROR
                    logger.error({
                      msg: 'Error creating collection',
                      err: {
                        errCode: rspObj.errCode,
                        errMsg: rspObj.errMsg,
                        responseCode: rspObj.responseCode
                      },
                      additionalInfo: {
                        error
                      }
                    }, req)
                    return response.status(400).send(errorResponse(rspObj))
                  })
              }, (error) => {
                rspObj.errCode = programMessages.COPY_COLLECTION.GET_HIERARCHY.FAILED_CODE,
                  rspObj.errMsg = programMessages.COPY_COLLECTION.GET_HIERARCHY.FAILED_MESSAGE,
                  rspObj.responseCode = responseCode.SERVER_ERROR
                logger.error({
                  msg: 'Error fetching hierarchy for collections',
                  err: {
                    errCode: rspObj.errCode,
                    errMsg: rspObj.errMsg,
                    responseCode: rspObj.responseCode
                  },
                  additionalInfo: {
                    error
                  }
                }, req)
                return response.status(400).send(errorResponse(rspObj))
              })
        }
      },
      (error) => {
        rspObj.errCode = programMessages.COPY_COLLECTION.SEARCH_DOCK_COLLECTION.FAILED_CODE,
          rspObj.errMsg = programMessages.COPY_COLLECTION.SEARCH_DOCK_COLLECTION.FAILED_MESSAGE,
          rspObj.responseCode = responseCode.SERVER_ERROR
        logger.error({
          msg: 'Error searching for collections',
          err: {
            errCode: rspObj.errCode,
            errMsg: rspObj.errMsg,
            responseCode: rspObj.responseCode
          },
          additionalInfo: {
            error
          }
        }, req)
        return response.status(400).send(errorResponse(rspObj))
      }
    )
}

function health(req, response) {
  return response.status(200).send(successResponse({
    apiId: 'api.program.health',
    ver: '1.0',
    msgid: uuid(),
    responseCode: 'OK',
    result: {}
  }));
}

function successResponse(data) {
  var response = {}
  response.id = data.apiId
  response.ver = data.apiVersion
  response.ts = new Date()
  response.params = getParams(data.msgid, 'successful', null, null)
  response.responseCode = data.responseCode || 'OK'
  response.result = data.result
  return response
}

/**
 * function create error response body.
 * @param {Object} data
 * @returns {nm$_responseUtil.errorResponse.response}
 */
function errorResponse(data) {
  var response = {}
  response.id = data.apiId
  response.ver = data.apiVersion
  response.ts = new Date()
  response.params = getParams(data.msgId, 'failed', data.errCode, data.errMsg)
  response.responseCode = data.responseCode
  response.result = data.result
  return response
}

function getParams(msgId, status, errCode, msg) {
  var params = {}
  params.resmsgid = uuid()
  params.msgid = msgId || null
  params.status = status
  params.err = errCode
  params.errmsg = msg

  return params
}

module.exports.getProgramAPI = getProgram
module.exports.createProgramAPI = createProgram
module.exports.updateProgramAPI = updateProgram
module.exports.deleteProgramAPI = deleteProgram
module.exports.programListAPI = programList
module.exports.addNominationAPI = addNomination
module.exports.programSearchAPI = programSearch
module.exports.updateNominationAPI = updateNomination
module.exports.removeNominationAPI = removeNomination
module.exports.programUpdateCollectionAPI = programUpdateCollection
module.exports.nominationsListAPI = getNominationsList
module.exports.programGetContentTypesAPI = getProgramContentTypes
module.exports.getUserDetailsAPI = getUsersDetailsById
module.exports.healthAPI = health
module.exports.programCopyCollectionAPI = programCopyCollections;
module.exports.addUserAPI= addUserToOrgRegistry