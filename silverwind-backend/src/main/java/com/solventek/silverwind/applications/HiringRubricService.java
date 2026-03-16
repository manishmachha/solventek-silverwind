package com.solventek.silverwind.applications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class HiringRubricService {

   
   public List<Document> retrieveRelevantRubric(String query) {
      log.info("Retrieving relevant rubric for query: {}", query);

      String text = """
            RUBRIC AND VERIFICATION STANDARDS:

            1. TIMELINE & CONSISTENCY:
               - Gaps > 3 months must be explained.
               - Overlapping full-time jobs are a HIGH risk signal (Overemployment risk).
               - Title progression should be logical (Junior -> Senior -> Lead).

            2. SKILLS EVIDENCE:
               - Claims of "Expert" must be backed by 5+ years or deep architectural project details.
               - "Tool Soup" (listing 50+ keywords) with generic bullets is a MEDIUM risk.
               - Required skills for the Job MUST appear in the Work Experience sections, not just the "Skills" list.

            3. PROJECT CREDIBILITY:
               - Projects must describe WHAT was built, HOW it was built (stack), and WHAT was the outcome.
               - Generic phrases ("Worked on CRUD", "Bug fixing") are LOW quality.
               - Specific metrics ("Reduced latency by 20%", "Handled 10k TPS") are HIGH quality.

            4. AUTHORSHIP:
               - Resume should sound like an engineer wrote it.
               - High density of buzzwords using identical templates is a risk.
            """;

      return List.of(new Document(text, Map.of("source", "static-rubric")));
   }
}
