import mammoth from 'mammoth';
import { Question, QuestionOption, QuestionType } from '../types/quiz';

export interface ParseResult {
  success: boolean;
  questions: Question[];
  rawText: string;
  errors: string[];
  stats: {
    total: number;
    singleChoice: number;
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
    missingAnswer: number;
  };
}

/**
 * Extracts plain text from a .docx file ArrayBuffer
 */
export async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (err: any) {
    console.error('Mammoth extraction failed:', err);
    throw new Error('Không thể đọc nội dung file Word. Vui lòng kiểm tra file có đúng định dạng .docx không.');
  }
}

/**
 * Clean and normalize text
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]+/g, ' ')
    .trim();
}

/**
 * Parse an exam text into structured questions
 */
export function parseExamContent(rawContent: string): ParseResult {
  const normalized = normalizeText(rawContent);
  const errors: string[] = [];

  // Match question headers like:
  // "Câu 1.", "Câu 1:", "Câu 1 -", "Bài 1.", "Bài 1:"
  const questionSplitRegex = /(?:^|\n)(?=(?:Câu|Bài|CÂU|BÀI)\s*\d+[\.\:\-\s])/gi;
  const rawBlocks = normalized.split(questionSplitRegex).map(b => b.trim()).filter(Boolean);

  if (rawBlocks.length === 0) {
    return {
      success: false,
      questions: [],
      rawText: rawContent,
      errors: ['Không tìm thấy cấu trúc câu hỏi (ví dụ: "Câu 1.", "Câu 2.", "Bài 1.").'],
      stats: { total: 0, singleChoice: 0, multipleChoice: 0, trueFalse: 0, shortAnswer: 0, missingAnswer: 0 },
    };
  }

  const questions: Question[] = [];

  rawBlocks.forEach((block, index) => {
    // Check if block actually starts with question header
    const headerMatch = block.match(/^(?:Câu|Bài|CÂU|BÀI)\s*(\d+)[\.\:\-\s]*(.*)/is);
    if (!headerMatch) return;

    const questionOrder = parseInt(headerMatch[1], 10) || index + 1;
    let remainingBlock = headerMatch[2].trim();

    // 1. Extract Explanation if present
    // "Hướng dẫn giải:", "Lời giải:", "Giải thích:", "HDG:", "HD:"
    let explanation = '';
    const explanationRegex = /(?:Hướng dẫn giải|Lời giải chi tiết|Lời giải|Giải thích|HDG|HD)\s*[\:\.\-]([\s\S]*)$/i;
    const expMatch = remainingBlock.match(explanationRegex);
    if (expMatch) {
      explanation = expMatch[1].trim();
      remainingBlock = remainingBlock.replace(explanationRegex, '').trim();
    }

    // 2. Extract Answer key if present
    // "Đáp án:", "Đáp án đúng:", "Đ/A:", "ĐA:", "Chọn:"
    let correctAnswerRaw = '';
    const answerRegex = /(?:Đáp án đúng|Đáp án|Đ\/A|ĐA|Chọn)\s*[\:\.\-]\s*([^\n\r]+)/i;
    const ansMatch = remainingBlock.match(answerRegex);
    if (ansMatch) {
      correctAnswerRaw = ansMatch[1].trim();
      remainingBlock = remainingBlock.replace(answerRegex, '').trim();
    }

    // 3. Detect Question Type:
    // Check for True/False sub-options: a), b), c), d) or a., b., c., d.
    const tfOptionRegex = /(?:^|\n)\s*([a-d])[\)\.]\s*(.+?)(?=(?:\n\s*[a-d][\)\.]|$))/gis;
    // Check for Standard 4 options: A., B., C., D. (or A), B), C), D))
    const stdOptionRegex = /(?:^|\n)\s*([A-D])[\)\.\:]\s*(.+?)(?=(?:\n\s*[A-D][\)\.\:]|$))/gis;

    let detectedType: QuestionType = 'single_choice';
    let questionContent = remainingBlock;
    const options: QuestionOption[] = [];
    let parsedCorrectAnswer: string | string[] = '';

    // Test for standard A, B, C, D options
    const stdMatches = [...remainingBlock.matchAll(stdOptionRegex)];

    if (stdMatches.length >= 2) {
      // It's a standard choice question
      const firstOptIndex = stdMatches[0].index || 0;
      questionContent = remainingBlock.substring(0, firstOptIndex).trim();

      stdMatches.forEach(m => {
        const optLetter = m[1].toUpperCase();
        const optText = m[2].trim();
        options.push({ id: optLetter, text: optText });
      });

      // Parse answer (e.g. "B" or "A, C" or "A và C")
      if (correctAnswerRaw) {
        const letters = correctAnswerRaw.toUpperCase().match(/[A-D]/g);
        if (letters && letters.length > 1) {
          detectedType = 'multiple_choice';
          parsedCorrectAnswer = Array.from(new Set(letters));
        } else if (letters && letters.length === 1) {
          detectedType = 'single_choice';
          parsedCorrectAnswer = letters[0];
        } else {
          parsedCorrectAnswer = correctAnswerRaw;
        }
      }
    } else {
      // Test for True/False question: a, b, c, d
      const tfMatches = [...remainingBlock.matchAll(tfOptionRegex)];
      if (tfMatches.length >= 2) {
        detectedType = 'true_false';
        const firstOptIndex = tfMatches[0].index || 0;
        questionContent = remainingBlock.substring(0, firstOptIndex).trim();

        tfMatches.forEach(m => {
          const optLetter = m[1].toLowerCase();
          const optText = m[2].trim();
          options.push({ id: optLetter, text: optText });
        });

        // Parse True/False answers (e.g. "a) Đ; b) S; c) Đ; d) S" or "a-Đ, b-S")
        parsedCorrectAnswer = correctAnswerRaw;
      } else {
        // No options detected -> Short Answer / Free input
        detectedType = 'short_answer';
        questionContent = remainingBlock.trim();
        parsedCorrectAnswer = correctAnswerRaw;
      }
    }

    // Fallback answer detection if teacher bolded or specified at end
    if (!parsedCorrectAnswer && correctAnswerRaw) {
      parsedCorrectAnswer = correctAnswerRaw;
    }

    questions.push({
      id: `q_${questionOrder}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order: questionOrder,
      type: detectedType,
      content: questionContent || `Câu hỏi ${questionOrder}`,
      options,
      correctAnswer: parsedCorrectAnswer,
      explanation,
      points: 1,
    });
  });

  const stats = {
    total: questions.length,
    singleChoice: questions.filter(q => q.type === 'single_choice').length,
    multipleChoice: questions.filter(q => q.type === 'multiple_choice').length,
    trueFalse: questions.filter(q => q.type === 'true_false').length,
    shortAnswer: questions.filter(q => q.type === 'short_answer').length,
    missingAnswer: questions.filter(q => !q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)).length,
  };

  return {
    success: questions.length > 0,
    questions,
    rawText: rawContent,
    errors,
    stats,
  };
}

/**
 * Built-in sample exam content for instant demo / one-click testing
 */
export const SAMPLE_EXAM_TEXT = `Câu 1. Thủ đô của Việt Nam là thành phố nào sau đây?
A. Thành phố Hồ Chí Minh
B. Đà Nẵng
C. Hà Nội
D. Cần Thơ
Đáp án: C
Hướng dẫn giải: Hà Nội là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam từ năm 1976 đến nay.

Câu 2. Trong các hợp chất sau, những chất nào là hợp chất hữu cơ?
A. C2H5OH
B. CaCO3
C. CH3COOH
D. CO2
Đáp án: A, C
Hướng dẫn giải: C2H5OH (ancol etylic) và CH3COOH (axit axetic) là các hợp chất hữu cơ. CaCO3 và CO2 là hợp chất vô cơ.

Câu 3. Xét tính Đúng / Sai của các mệnh đề sau về hình học phẳng:
a) Tổng ba góc trong một tam giác luôn bằng 180 độ.
b) Hình thang có hai đường chéo bằng nhau là hình thoi.
c) Tam giác đều có ba trục đối xứng.
d) Tứ giác có bốn góc vuông là hình chữ nhật.
Đáp án: a) Đ; b) S; c) Đ; d) Đ
Hướng dẫn giải:
- a) Đúng: Định lý tổng ba góc trong tam giác.
- b) Sai: Hình thang cân mới có hai đường chéo bằng nhau.
- c) Đúng: Tam giác đều có 3 trục đối xứng là các đường trung trực.
- d) Đúng: Định nghĩa hình chữ nhật.

Câu 4. Cho phương trình 2x + 6 = 16. Giá trị của x bằng bao nhiêu?
Đáp án: 5
Hướng dẫn giải: 2x = 16 - 6 => 2x = 10 => x = 5.

Câu 5. Tác phẩm "Truyện Kiều" được sáng tác bởi đại thi hào nào?
A. Nguyễn Trãi
B. Nguyễn Du
C. Hồ Xuân Hương
D. Đoàn Thị Điểm
Đáp án: B
Hướng dẫn giải: Nguyễn Du (1765 - 1820) là tác giả của kiệt tác Đoạn trường tân thanh (Truyện Kiều).`;
