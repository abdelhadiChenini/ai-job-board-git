// Slide content for the Training Hub presentation player.
// Shape: [{ title, slides: [{ title, content }] }] — parsed by lib/courses.ts.

export const rubricCourseModules = [
  {
    title: "Foundations of Rubrics",
    slides: [
      {
        title: "Intro to Rubrics",
        content:
          "A fundamental introduction to rubrics, a critical type of post-training data used by frontier AI labs. The principles of crafting and applying good rubrics are rooted in how they directly improve the LLMs you interact with every day.",
      },
      {
        title: "Why 'Good' vs 'Bad' Isn't Enough",
        content:
          "When evaluating an LLM, a response can fail in multiple ways—it might be factually incorrect, poorly formatted, unsafe, or overly verbose. If a reviewer only labels a response as 'good' or 'bad', the engineering team loses the specific signal required to fix the underlying model weights.",
      },
      {
        title: "Bridging the Gap",
        content:
          "A strong rubric turns abstract goals (like 'be helpful' or 'be safe') into strict, reviewable dimensions with defined score anchors. It establishes a shared language between human evaluators and AI developers.",
      },
      {
        title: "Module 1 Assessment Check",
        content:
          "Key Takeaways:\n- Rubrics provide a structured middle layer.\n- They isolate failure signals so model drift can be caught quickly.\n- Consistent rubric application is the foundation of high-quality RLHF.",
      },
    ],
  },
  {
    title: "Anatomy of a Rubric",
    slides: [
      {
        title: "The 5 Pillars of a Practical Rubric",
        content:
          "A production-ready evaluation rubric does not try to be comprehensive; it tries to be legible, operational, and repeatable. Broken down into five distinct parts: Task Framing, Dimensions, Score Anchors, Evidence Rules, and Adjudication Notes.",
      },
      {
        title: "Setting the Boundaries",
        content:
          "Task Framing: Start with the exact job the model is supposed to do. Evidence Rules: Explicitly state what the evaluator is allowed to use.",
      },
      {
        title: "Eliminating Guesswork",
        content:
          "Never use a 1-5 scale without definitions. Every number must have a strict Anchor (e.g., 4 = Addresses all important parts of the user's request without adding unprompted information).",
      },
      {
        title: "Handling Disagreement",
        content:
          "Adjudication notes are living documents attached to the rubric that define how to handle specific edge cases, ensuring that future reviewers have a stable decision path.",
      },
    ],
  },
  {
    title: "Dimensions, Instructions, and Weighting",
    slides: [
      {
        title: "Choosing What to Measure",
        content:
          "Choosing what to measure, writing instructions that remove ambiguity, and deciding what counts more. Break the response down into isolated dimensions.",
      },
      {
        title: "Standard Dimensions",
        content:
          "Most frontier labs evaluate across these core axes: Instruction Adherence, Accuracy / Groundedness, Safety, and Tone / Style.",
      },
      {
        title: "Weighting the Criteria",
        content:
          "Some criteria matter significantly more than others. Groundedness and Safety should almost always carry the highest weight in a scoring algorithm, triggering an automatic failure if breached.",
      },
      {
        title: "Avoiding Common Biases",
        content:
          "Human evaluators are susceptible to biases. Verbosity Bias: Assuming a longer answer is better. Position Bias: Focusing heavily on the first and last sentences. Always apply the rubric strictly to the entire text.",
      },
    ],
  },
];
