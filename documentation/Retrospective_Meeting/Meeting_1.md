# Sprint 1 Retrospective Meeting Minutes

**Project:** KnockKnock.prof Consultation Scheduler  
**Course:** Software Development III (ELEN4010)  
**Institution:** University of the Witwatersrand, Johannesburg  
**Date:** 25 April 2026  

**Attendees:** 
* Suné Toerien (Sarcastic Sunflower)
* Aditya Raghunandan (Aditya Raghunandan)
* Thandeka Malasa (ThandiAlgorithm)

## 1. Sprint Velocity Calculation
**Achieved Velocity: 39 Story Points**

The team successfully completed 39 story points during Sprint 1. This establishes our baseline capacity for future sprint planning.

## 2. What Went Well
* **Strong Initial Velocity & Foundation Building:** The team successfully delivered the core structural requirements, including the database tables (Student, Staff, and Consultation), basic authentication (Sign Up and Log in), and the static dashboards for both students and lecturers.
* **Excellent CI/CD Prioritisation:** Setting up the CI pipeline, automated testing on push/pull, and configuring Coveralls coverage early in the project establishes a robust technical foundation and satisfies a core laboratory process requirement. The Coveralls website showed 100% for the source code.
* **Solid Agile Hygiene and Traceability:** The team effectively linked pull requests to specific issues. The required labels (user story and developer sized story) were applied consistently, maintaining a highly organised Scrum board.
* **Balanced Team Collaboration:** The completed tasks and pull requests were distributed evenly across all team members, demonstrating active, collaborative software development. The database was split between two team members and each feature had a frontend and backend.
* **Rigorous Peer Review Process:** The team consistently leveraged Pull Requests to review each other's work, proactively identifying and addressing areas for improvement before merging into the main branch.

## 3. What Did Not Go Well
* **Eleventh Hour Infrastructure Paralysis:** The most devastating setback of Sprint 1 was a critical infrastructure delay completely outside the team's control. GitHub Actions and Render permissions were only enabled on the organisation repository at 20:07 on Thursday. With the sprint deadline set for 23:59 on Friday, this left the team 27 hours and 52 minutes to configure, troubleshoot, and successfully deploy the CI/CD pipeline. The team member responsible for this pipeline spent several hours troubleshooting what was ultimately an organisation level permission issue. This extensive debugging time significantly delayed their concurrent work on the student database, which bottlenecked our initial backend progress.
* **Forced Chaos and Cascading Delays:** Because the CI/CD pipeline and automated deployment are fundamental process requirements for this laboratory, being locked out of GitHub Actions until the final day paralysed our testing strategy. It turned what should have been a methodical, iterative release into a frantic, high stakes race against the clock, severely bottlenecking our ability to run automated tests and finalise code reviews before the deadline.
* **Critical Path Bottlenecks:** The database implementation took longer than initially estimated. Because the backend user stories were strictly dependent on the database architecture, this created a cascading delay that blocked further development.
* **Integration and Merge Conflicts:** Significant merge conflicts arose when integrating the database branches into the main trunk, consuming valuable time to resolve securely.
* **Incomplete Test Coverage:** Due to the time constraints caused by the database delays and merge conflicts, not all planned automated tests were implemented or pushed before the sprint concluded.
* **Missed Release Deadline:** The culmination of blockers and integration issues resulted in the final sprint release being tagged and published an hour past the agreed upon deadline.

## 4. Action Items for Next Sprint
* **Evidence Based Sprint Planning:** The team recognises that the 39 story points completed in Sprint 1 is a realistic and achievable baseline. For Sprint 2, we will plan our capacity around this 39 point velocity, confident that without severe external infrastructure blockers, this workload is well within the team's capabilities.
* **Prioritise Blockers:** The team will identify critical dependencies during Sprint Planning and ensure those developer sized stories are assigned and completed in the first few days of the sprint to unblock the rest of the development pipeline.
* **Continuous Integration Practices:** To mitigate severe merge conflicts, team members will commit and push smaller, more frequent pull requests rather than waiting to merge large, monolithic features.
* **Strict Definition of Done (DoD):** The team will enforce a rule that no pull request can be merged unless its accompanying acceptance tests are written and passing, preventing testing from being deferred to the end of the sprint.
* **Buffer Time for Releases:** The team will schedule the internal code freeze and release processes at least 12 hours before the final deadline to provide a buffer for unexpected integration issues.
