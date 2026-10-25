# Security Specification: QUIZ PRO

## 1. Data Invariants
- Teachers can only access, view, edit, or delete their own quizzes (`ownerUid == request.auth.uid`).
- Students without accounts cannot inspect secret quiz questions or answer keys directly via Firestore queries.
- Question answers (`correctAnswer`) and step-by-step explanations (`explanation`) are kept strictly confidential during test administration.
- Grading is validated on the backend/server authority to prevent client tampering.
- Answers and explanations are revealed to students strictly according to the teacher's configured policy (`minScoreToRevealAnswers`, `revealAnswersMode`).
- Password protection for quizzes is enforced before delivering questions.
- Attempts once submitted are immutable.

## 2. Tested Threat Scenarios ("Dirty Dozen")
1. Unauthenticated client attempting to list all quizzes in `/quizzes` -> Rejected (PERMISSION_DENIED).
2. Teacher A attempting to read/update/delete Teacher B's quiz -> Rejected (PERMISSION_DENIED).
3. Student attempting to read `/quizzes/{quizId}/questions` directly to see `correctAnswer` -> Rejected (PERMISSION_DENIED).
4. Student attempting to alter an already submitted score in `/attempts/{attemptId}` -> Rejected (PERMISSION_DENIED).
5. User attempting to register as `role: "admin"` directly in `/users` -> Defaults to teacher, admin verification strictly enforced.
6. Attacker injecting 50MB payload in quiz title -> Rejected by length constraints.
7. Attempting to access unpublished draft quiz without owner authentication -> Rejected (PERMISSION_DENIED).
8. Client fabricating their own score during submission -> Overruled by server-side verification and answer matching.
9. Attempting to read other students' attempt details without teacher ownership -> Rejected.
10. Impersonating teacher UID in attempt or quiz creation -> Rejected (`request.auth.uid == ownerUid`).
11. Bypassing quiz password via direct client fetching -> Server enforces password validation before quiz payload release.
12. Attempting to view solution explanations when score is below teacher threshold -> Server filters out explanations.
