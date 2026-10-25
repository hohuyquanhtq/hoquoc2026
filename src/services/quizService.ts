import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Quiz, Question, QuizAttempt, QuizSettings, StudentQuestion } from '../types/quiz';

function generatePublicCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  let code = 'QP-';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return code;
}

export async function createQuiz(
  teacherUid: string,
  teacherEmail: string,
  settings: QuizSettings,
  questions: Question[]
): Promise<Quiz> {
  const path = 'quizzes';
  try {
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const publicCode = generatePublicCode();
    const now = new Date().toISOString();

    const quizData: Quiz = {
      ...settings,
      id: quizId,
      publicCode,
      status: 'draft',
      ownerUid: teacherUid,
      ownerEmail: teacherEmail,
      questionCount: questions.length,
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    const quizDocRef = doc(db, 'quizzes', quizId);
    batch.set(quizDocRef, quizData);

    // Add each question to subcollection
    questions.forEach((q, idx) => {
      const qDocRef = doc(db, 'quizzes', quizId, 'questions', q.id || `q_${idx + 1}`);
      batch.set(qDocRef, {
        ...q,
        id: q.id || `q_${idx + 1}`,
        order: idx + 1,
      });
    });

    await batch.commit();
    return quizData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateQuiz(
  quizId: string,
  settings: Partial<QuizSettings>,
  questions?: Question[]
): Promise<void> {
  const path = `quizzes/${quizId}`;
  try {
    const batch = writeBatch(db);
    const quizDocRef = doc(db, 'quizzes', quizId);

    const updatePayload: any = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    if (questions) {
      updatePayload.questionCount = questions.length;
    }
    batch.update(quizDocRef, updatePayload);

    if (questions) {
      // Overwrite/update questions
      questions.forEach((q, idx) => {
        const qDocRef = doc(db, 'quizzes', quizId, 'questions', q.id || `q_${idx + 1}`);
        batch.set(qDocRef, {
          ...q,
          order: idx + 1,
        });
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const path = `quizzes/${quizId}`;
  try {
    // Delete questions subcollection
    const qSnap = await getDocs(collection(db, 'quizzes', quizId, 'questions'));
    const batch = writeBatch(db);
    qSnap.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'quizzes', quizId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getTeacherQuizzes(teacherUid: string): Promise<Quiz[]> {
  const path = 'quizzes';
  try {
    const q = query(
      collection(db, 'quizzes'),
      where('ownerUid', '==', teacherUid)
    );
    const snap = await getDocs(q);
    const list: Quiz[] = [];
    snap.forEach(d => list.push(d.data() as Quiz));
    // Sort client-side by createdAt desc
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getQuizById(quizId: string): Promise<Quiz | null> {
  const path = `quizzes/${quizId}`;
  try {
    const snap = await getDoc(doc(db, 'quizzes', quizId));
    if (!snap.exists()) return null;
    return snap.data() as Quiz;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getQuizQuestions(quizId: string): Promise<Question[]> {
  const path = `quizzes/${quizId}/questions`;
  try {
    const snap = await getDocs(collection(db, 'quizzes', quizId, 'questions'));
    const questions: Question[] = [];
    snap.forEach(d => questions.push(d.data() as Question));
    questions.sort((a, b) => a.order - b.order);
    return questions;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function setQuizStatus(quizId: string, status: 'draft' | 'published' | 'closed'): Promise<void> {
  const path = `quizzes/${quizId}`;
  try {
    await updateDoc(doc(db, 'quizzes', quizId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const path = `quizzes/${quizId}/attempts`;
  try {
    const snap = await getDocs(collection(db, 'quizzes', quizId, 'attempts'));
    const attempts: QuizAttempt[] = [];
    snap.forEach(d => attempts.push(d.data() as QuizAttempt));
    attempts.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return attempts;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteAttempt(quizId: string, attemptId: string): Promise<void> {
  const path = `quizzes/${quizId}/attempts/${attemptId}`;
  try {
    await deleteDoc(doc(db, 'quizzes', quizId, 'attempts', attemptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
