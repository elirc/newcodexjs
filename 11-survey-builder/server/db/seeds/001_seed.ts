import crypto from "node:crypto";
import type { Knex } from "knex";

const types = ["short_text", "long_text", "single_choice", "multi_choice", "rating", "yes_no", "number", "date", "matrix"];

/** Seeds realistic survey, question, option, and response data. */
export async function seed(knex: Knex): Promise<void> {
  await knex("response_answers").del();
  await knex("responses").del();
  await knex("question_options").del();
  await knex("questions").del();
  await knex("surveys").del();
  await knex("users").del();

  const [owner, researcher] = await knex("users")
    .insert([
      { email: "owner@example.com", display_name: "Product Owner" },
      { email: "research@example.com", display_name: "UX Researcher" }
    ])
    .returning("*");

  const surveys = await knex("surveys")
    .insert([
      { user_id: owner.id, title: "Customer onboarding feedback", description: "Measure the first week experience.", status: "active", public_token: crypto.randomBytes(24).toString("hex"), max_responses: 100 },
      { user_id: owner.id, title: "Website redesign poll", description: "Preference testing for new navigation.", status: "active", public_token: crypto.randomBytes(24).toString("hex"), max_responses: 80 },
      { user_id: owner.id, title: "Support satisfaction", description: "Closed quarterly CSAT.", status: "closed", public_token: crypto.randomBytes(24).toString("hex"), response_count: 0 },
      { user_id: researcher.id, title: "Template: event RSVP", description: "Reusable event survey.", status: "draft", is_template: true },
      { user_id: researcher.id, title: "Internal tools audit", description: "Draft survey for operations.", status: "draft" }
    ])
    .returning("*");

  for (const survey of surveys) {
    const questionCount = survey.status === "draft" ? 5 : 7;
    for (let index = 0; index < questionCount; index += 1) {
      const questionType = types[index % types.length];
      const [question] = await knex("questions")
        .insert({
          survey_id: survey.id,
          question_type: questionType,
          title: `${questionType.replace("_", " ")} question ${index + 1}`,
          is_required: index % 2 === 0,
          sort_order: index + 1,
          config:
            questionType === "rating"
              ? { min: 1, max: 5, labels: { "1": "Poor", "5": "Excellent" } }
              : questionType === "matrix"
                ? { rows: ["Price", "Quality", "Support"], columns: ["Poor", "Fair", "Good", "Excellent"] }
                : questionType === "number"
                  ? { min: 0, max: 100, step: 1 }
                  : null
        })
        .returning("*");
      if (questionType.includes("choice")) {
        await knex("question_options").insert(["Very satisfied", "Satisfied", "Neutral", "Unsatisfied"].map((label, optionIndex) => ({ question_id: question.id, label, sort_order: optionIndex + 1 })));
      }
    }
  }

  const activeSurveys = surveys.filter((survey) => survey.status !== "draft");
  for (const survey of activeSurveys) {
    const questions = await knex("questions").where({ survey_id: survey.id }).orderBy("sort_order");
    const options = await knex("question_options").whereIn("question_id", questions.map((question) => question.id));
    for (let responseIndex = 0; responseIndex < 24; responseIndex += 1) {
      const [response] = await knex("responses").insert({ survey_id: survey.id, completed_at: knex.fn.now() }).returning("*");
      await knex("response_answers").insert(
        questions.map((question) => {
          const questionOptions = options.filter((option) => option.question_id === question.id);
          if (question.question_type === "rating") return { response_id: response.id, question_id: question.id, rating_value: (responseIndex % 5) + 1 };
          if (question.question_type.includes("choice")) {
            const option = questionOptions[responseIndex % Math.max(questionOptions.length, 1)];
            return { response_id: response.id, question_id: question.id, selected_option_id: option?.id, selected_option_ids: question.question_type === "multi_choice" ? [option?.id].filter(Boolean) : null, answer_text: option?.label };
          }
          if (question.question_type === "matrix") return { response_id: response.id, question_id: question.id, matrix_answers: { Price: "Good", Quality: "Excellent", Support: "Fair" } };
          return { response_id: response.id, question_id: question.id, answer_text: `Sample answer ${responseIndex + 1}` };
        })
      );
    }
    await knex("surveys").where({ id: survey.id }).update({ response_count: 24 });
  }
}

