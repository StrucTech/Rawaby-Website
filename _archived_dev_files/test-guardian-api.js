// Test script للتأكد من أن Guardian API يعمل بشكل صحيح
const testData = {
  guardian: {
    fullName: "احمد محمد الاختبار",
    mobileNumber: "01012345678",
    nationalId: "12345678901234"
  },
  student: {
    fullName: "محمد احمد الاختبار", 
    grade: "الثالث الثانوي",
    totalScore: "95%",
    certificateType: "علمي"
  }
};

console.log("Test data for Guardian API:");
console.log(JSON.stringify(testData, null, 2));

// Check validation patterns
const egyptMobilePattern = /^(01)[0-9]{9}$/;
const nationalIdPattern = /^[0-9]{14}$/;

console.log("\nValidation checks:");
console.log("Mobile valid:", egyptMobilePattern.test(testData.guardian.mobileNumber.replace(/[\s\-\+]/g, '')));
console.log("National ID valid:", nationalIdPattern.test(testData.guardian.nationalId));

// Expected endpoint: POST /api/guardian-student
console.log("\nExpected API call:");
console.log("Method: POST");
console.log("URL: /api/guardian-student");
console.log("Headers: Authorization: Bearer [token], Content-Type: application/json");
console.log("Body:", JSON.stringify(testData));