import { answerQuestion } from "../lib/openai.js";
import { saveRecord, listRecords } from "../lib/storage.js";

const questions = [
  "00402A是追蹤哪個指數？",
  "00402A可以去哪裡買？",
  "風險等級是多少？"
];

for (const question of questions) {
  const result = await answerQuestion(question);
  console.log("\nQ:", question);
  console.log("answered:", result.answered, "reason:", result.reason);
  console.log(result.answer);
}

await saveRecord("self_test", { message: "storage ok" });
const records = await listRecords(3);
console.log("\nrecords:", records.length);
