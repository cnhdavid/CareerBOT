/**
 * Generate a list of interview questions based on job title and level
 * @param {string} jobTitle - Target job position (e.g., "Product Manager", "Senior Software Engineer")
 * @param {string} jobLevel - Job level (e.g., "junior", "senior") - optional
 * @returns {Array<string>} Array of 7 interview questions
 */
export function generateInterviewQuestions(jobTitle = "", jobLevel = "mid-level") {
  const jobTitleLower = jobTitle.toLowerCase().trim();

  // Generic questions applicable to all positions
  const genericQuestions = [
    `Tell me about your experience that makes you a strong candidate for a ${jobTitle} role.`,
    `What are the key challenges you anticipate in this ${jobTitle} position, and how would you address them?`,
    `Describe a time when you had to learn a new skill or technology quickly. How did you approach it?`,
    `How do you stay updated with industry trends and best practices in your field?`,
    `Tell me about a situation where you had to work with a difficult team member or manager. How did you handle it?`,
    `What are your long-term career goals, and how does this ${jobTitle} position fit into your plan?`,
    `Describe a project where you took the lead. What was the outcome?`,
  ];

  // Role-specific questions
  let roleSpecificQuestions = [];

  if (jobTitleLower.includes("product manager") || jobTitleLower.includes("pm")) {
    roleSpecificQuestions = [
      "How would you approach gathering requirements for a new product feature?",
      "Describe your experience with competitive analysis. How do you use it to inform product decisions?",
      "Tell me about a product launch you were involved in. What made it successful or challenging?",
      "How do you prioritize features when you have unlimited ideas but limited resources?",
      "What metrics do you use to measure product success?",
      "How would you handle disagreement between engineering and design teams?",
      "Describe your experience with user research. How do you incorporate user feedback into the product roadmap?",
    ];
  } else if (
    jobTitleLower.includes("software engineer") ||
    jobTitleLower.includes("developer") ||
    jobTitleLower.includes("engineer")
  ) {
    roleSpecificQuestions = [
      "Describe a complex technical problem you solved. What was your approach?",
      "How do you ensure code quality and maintainability in your projects?",
      "Tell me about your experience with testing. What types of tests do you prioritize?",
      "How do you approach debugging a critical production issue?",
      "Describe your experience with code reviews. How do you provide and receive feedback?",
      "Tell me about your experience with system design. How do you approach designing a scalable system?",
      "What development practices or tools do you find most valuable in your workflow?",
    ];
  } else if (
    jobTitleLower.includes("data analyst") ||
    jobTitleLower.includes("analyst")
  ) {
    roleSpecificQuestions = [
      "Describe a data analysis project that led to actionable business insights.",
      "What tools and programming languages are you most proficient with for data analysis?",
      "How do you approach cleaning and preparing data for analysis?",
      "Tell me about a time when your analysis led to a significant business decision.",
      "How do you ensure data accuracy and integrity in your analyses?",
      "Describe your experience with data visualization. How do you choose the right visualization type?",
      "What metrics do you find most important when evaluating business performance?",
    ];
  } else if (
    jobTitleLower.includes("marketing") ||
    jobTitleLower.includes("growth")
  ) {
    roleSpecificQuestions = [
      "Describe a successful marketing campaign you led or contributed to.",
      "How do you measure the ROI of marketing initiatives?",
      "Tell me about your experience with digital marketing channels. Which have you found most effective?",
      "How do you approach customer segmentation and targeting?",
      "Describe a time when a marketing strategy didn't work as expected. How did you pivot?",
      "What is your experience with marketing automation tools?",
      "How do you balance short-term marketing goals with long-term brand building?",
    ];
  } else if (jobTitleLower.includes("designer") || jobTitleLower.includes("ux")) {
    roleSpecificQuestions = [
      "Walk me through your design process, from problem to solution.",
      "Describe a design decision you made that had a significant impact on user experience.",
      "How do you gather and incorporate user feedback into your designs?",
      "Tell me about your experience with design tools and prototyping.",
      "How do you approach designing for accessibility?",
      "Describe a time when your design ideas conflicted with technical constraints. How did you solve it?",
      "What design trends or methodologies have influenced your work recently?",
    ];
  } else if (jobTitleLower.includes("sales")) {
    roleSpecificQuestions = [
      "Describe your approach to prospecting and building a sales pipeline.",
      "Tell me about your most significant sale. What made it successful?",
      "How do you handle rejection or objections from potential clients?",
      "What's your experience with CRM tools and sales methodologies?",
      "Describe a long sales cycle you managed. How did you stay motivated?",
      "How do you prioritize your time between acquiring new clients and maintaining existing relationships?",
      "Tell me about a time when you had to sell a complex or difficult product.",
    ];
  }

  // Combine and shuffle for variety
  const allQuestions = [...genericQuestions, ...roleSpecificQuestions];
  
  // Shuffle and return 7 questions
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 7);
}
