const { styles } = require("./docStyles");

const getStudentTeacherDetails = () => ({
  table: {
    widths: ["*", "*"],
    body: [
      [
        {
          border: [false, false, false, false],
          text: "Student Name ________________________",
          style: "header_left",
        },
        {
          border: [false, false, false, false],
          text: "Roll number ________________________",
          style: "header_left",
        },
      ],
      [
        {
          border: [false, false, false, false],
          text: "Teacher's name _______________________",
          style: "header_left",
        },
        {
          border: [false, false, false, false],
          text: "Teacher's Sign ______________________",
          style: "header_left",
        },
      ],
    ],
  },
});

const getExamName = (examName) => ({
  text: examName,
  style: "header",
});

const getGradeHeader = (grade) => ({
  text: `Grade - ${grade}`,
  style: "header",
});

const docDefinition = {
  content: [],
  styles: styles,
};

function getComprehension(data, language, marks) {
  return {
    table: {
      widths: ["100%", "auto"],
      body: [
        [
          {
            border: [false, false, false, false],
            stack: data,
            style: "question_COMPREHENSION",
            font: language,
          },
          {
            border: [false, false, false, false],
            text: marks,
            style: "header_right",
          },
        ],
      ],
    },
  };
}

function getLA(data, language, marks) {
  return {
    table: {
      widths: ["95%", "*"],
      body: [
        [
          {
            border: [false, false, false, false],
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    border: [false, false, false, false],
                    stack: data,
                    style: "question_LA",
                  },
                ],
                [
                  {
                    border: [false, false, false, false],
                    text:
                      "_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________\n\n_______________________________________________________________________________________",
                    style: "question_LA",
                  },
                ],
              ],
            },
          },
          {
            border: [false, false, false, false],
            text: marks,
            style: "header_right",
          },
        ],
      ],
    },
  };
}

function getVSA(data, language, marks) {
  return {
    table: {
      widths: ["95%", "*"],
      body: [
        [
          {
            border: [false, false, false, false],
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    border: [false, false, false, false],
                    stack: data,
                    style: "question_VSA",
                  },
                ],
                [
                  {
                    border: [false, false, false, false],
                    text:
                      "______________________________________________________________________________________",
                    style: "question_VSA",
                  },
                ],
              ],
            },
          },
          {
            border: [false, false, false, false],
            text: marks,
            style: "header_right",
          },
        ],
      ],
    },
  };
}

function getSA(data, language, marks) {
  return {
    table: {
      widths: ["95%", "*"],
      body: [
        [
          {
            border: [false, false, false, false],
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    border: [false, false, false, false],
                    stack: data,
                    style: "question_SA",
                  },
                ],
                [
                  {
                    border: [false, false, false, false],
                    text:
                      "______________________________________________________________________________________\n\n______________________________________________________________________________________\n\n______________________________________________________________________________________",
                    style: "question_VSA",
                  },
                ],
              ],
            },
          },
          {
            border: [false, false, false, false],
            text: marks,
            style: "header_right",
          },
        ],
      ],
    },
  };
}

function getTF(questionTitle, language, marks) {
  return {
    table: {
      widths: ["auto", 50],
      body: [
        [
          {
            border: [false, false, false, false],
            text: questionTitle,
            style: "question_TF",
            font: language,
          },
          {
            border: [true, true, true, true],
            text: "",
            style: "question_TF",
          },
        ],
      ],
    },
  };
}

function getMTFHeader(left, right, language) {
  return {
    table: {
      widths: ["*", "*"],
      body: [
        [
          {
            border: [false, false, true, true],
            margin: [40, 0],
            text: left,
            style: "question_MTF",
            font: language,
            bold: "true",
          },
          {
            border: [false, false, false, true],
            margin: [40, 0],
            text: right,
            style: "question_MTF",
            bold: "true",
            font: language,
          },
        ],
      ],
    },
  };
}

function getMTFChoice(left, right, language) {
  return {
    table: {
      widths: ["*", "*"],
      body: [
        [
          {
            border: [false, false, true, true],
            stack: left,
            margin: [40, 0],
            style: "question_MTF",
            font: language,
          },
          {
            border: [false, false, false, true],
            stack: right,
            margin: [40, 0],
            style: "question_MTF",
            font: language,
          },
        ],
      ],
    },
  };
}

function getFTB(data, language, marks) {
  return {
    // Time + Marks
    table: {
      widths: ["*", "auto"],
      body: [
        [
          {
            border: [false, false, false, false],
            stack: data,
            style: "question_FTB"            
          },
          {
            border: [false, false, false, false],
            text: marks,
            style: "header_right",
          },
        ],
      ],
    },
  };
}

function getMCQ(questionTitle, questionOptions, language, marks) {
  return {
    table: {
      widths: ["*", "auto"],
      body: [
        [
          {
            border: [false, false, false, false],
            table: {
              widths: ["*", "*", "*", "*"],
              body: [
                [
                  {
                    border: [false, false, false, false],
                    stack: questionTitle,
                    style: "question_MCQ",
                    font: language,
                    colSpan: 4,
                  },
                  {},
                  {},
                  {},
                ],
                [
                  {
                    border: [false, false, false, false],
                    stack: [questionOptions[0]],
                    style: "question_MCQ",
                    font: language,
                  },
                  {
                    border: [false, false, false, false],
                    stack: [questionOptions[1]],
                    style: "question_MCQ",
                    font: language,
                  },
                  {
                    border: [false, false, false, false],
                    stack: [questionOptions[2]],
                    style: "question_MCQ",
                    font: language,
                  },
                  {
                    border: [false, false, false, false],
                    stack: [questionOptions[3]],
                    style: "question_MCQ",
                    font: language,
                  },
                ],
              ],
            },
          },
          {
            border: [false, false, false, false],
            text: marks,
            style: "header_right", //Marsk will be dynamic
          },
        ],
      ],
    },
  };
}

function getSectionTitle(sectionTitle, language) {
  return {
    text: sectionTitle,
    style: "section_header",
    font: language,
  };
}

function getInstructions(instructions, language) {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            border: [false, true, false, true],
            text: instructions,
            font: language,
            style: "instruction",
          },
        ],
      ],
    },
  };
}

function getTimeAndMarks(time, marks) {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            border: [false, false, false, false],
            text: "Marks - " + marks,
            style: "header_left",
          },
        ],
      ],
    },
  };
}

function getSubject(subject) {
  return {
    text: `Subject - ${subject}`,
    style: "header",
  };
}

module.exports = {
  docDefinition,
  getStudentTeacherDetails,
  getExamName,
  getGradeHeader,
  getSubject,
  getTimeAndMarks,
  getInstructions,
  getSectionTitle,
  getMCQ,
  getFTB,
  getTF,
  getSA,
  getVSA,
  getLA,
  getComprehension,
  getMTFHeader,
  getMTFChoice,
};
