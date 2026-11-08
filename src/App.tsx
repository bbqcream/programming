import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileUp,
  Layers3,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import {
  questions as initialQuestions,
  type QuizQuestion,
} from "./data/questions";
import type { QuizTable } from "./data/questions";

type Screen = "home" | "quiz" | "result";

function parseQuestionData(value: unknown): QuizQuestion[] {
  const records = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "questions" in value
      ? (value as { questions: unknown }).questions
      : null;

  if (!Array.isArray(records)) {
    throw new Error(
      '문제 배열을 찾을 수 없어요. 배열 또는 { "questions": [...] } 형식을 사용해 주세요.',
    );
  }

  return records.map((record, index) => {
    if (!record || typeof record !== "object") {
      throw new Error(`${index + 1}번 문제의 형식을 확인해 주세요.`);
    }

    const item = record as Record<string, unknown>;
    const category =
      typeof item.category === "string" ? item.category.trim() : "";
    const question =
      typeof item.question === "string" ? item.question.trim() : "";
    const answer = item.answer;

    if (
      !category ||
      !question ||
      typeof answer !== "string" ||
      typeof item.type !== "string"
    ) {
      throw new Error(
        `${index + 1}번 문제의 category, question, type, answer 값을 확인해 주세요.`,
      );
    }

    return {
      id: typeof item.id === "string" ? item.id : String(index + 1),
      category,
      subcategory:
        typeof item.subcategory === "string" ? item.subcategory : undefined,
      title: typeof item.title === "string" ? item.title : `문제 ${index + 1}`,
      difficulty: typeof item.difficulty === "number" ? item.difficulty : 1,
      day: typeof item.day === "number" ? item.day : 1,
      type: item.type,
      question,
      code: typeof item.code === "string" ? item.code : undefined,
      code_language:
        typeof item.code_language === "string" ? item.code_language : undefined,
      tables: Array.isArray(item.tables)
        ? (item.tables as QuizTable[])
        : undefined,
      answer,
      model_answer:
        typeof item.model_answer === "string" ? item.model_answer : undefined,
      explanation:
        typeof item.explanation === "string" ? item.explanation : undefined,
    };
  });
}

function expectedAnswer(question: QuizQuestion) {
  return question.type === "sql_write"
    ? (question.model_answer ?? question.answer)
    : question.answer;
}

function isCorrectAnswer(question: QuizQuestion, answer: string) {
  const expected = expectedAnswer(question);
  if (
    ["code_output", "script_output", "command_output", "sql_result"].includes(
      question.type,
    )
  ) {
    const normalizeOutput = (value: string) =>
      value
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim();
    return normalizeOutput(answer) === normalizeOutput(expected);
  }

  const normalizeText = (value: string) =>
    value.replace(/\s+/g, " ").trim().replace(/;$/, "").toLowerCase();
  return normalizeText(answer) === normalizeText(expected);
}

function App() {
  const [allQuestions, setAllQuestions] =
    useState<QuizQuestion[]>(initialQuestions);
  const [screen, setScreen] = useState<Screen>("home");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const categories = [
    ...new Set(allQuestions.map((question) => question.category)),
  ];
  const quizQuestions = activeCategory
    ? allQuestions.filter((question) => question.category === activeCategory)
    : allQuestions;
  const currentQuestion = quizQuestions[questionIndex];
  const correctCount = quizQuestions.reduce(
    (total, question, index) =>
      total + (isCorrectAnswer(question, answers[index] ?? "") ? 1 : 0),
    0,
  );

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = parseQuestionData(JSON.parse(await file.text()));
      setAllQuestions(parsed);
      setNotice(
        parsed.length
          ? `${parsed.length}개 문제를 불러왔어요.`
          : "파일에 문제가 없어요.",
      );
      setScreen("home");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "파일을 읽지 못했어요.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function startQuiz(category: string | null) {
    setActiveCategory(category);
    setQuestionIndex(0);
    setAnswers({});
    setScreen("quiz");
  }

  function finishQuiz() {
    setScreen("result");
  }

  function goHome() {
    setScreen("home");
    setNotice("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="기능사 랩 홈">
          <span className="brand-mark">
            <Layers3 size={20} strokeWidth={2.2} />
          </span>
          <span>
            기능사<span className="brand-light">랩</span>
          </span>
        </button>
        <div className="topbar-right">
          <span className="topbar-caption">자격증을 향한 오늘의 한 문제</span>
          <button
            className="icon-button help-button"
            aria-label="문제 데이터 형식 안내"
            title="JSON 파일로 문제를 불러올 수 있어요"
          >
            <CircleHelp size={18} />
          </button>
        </div>
      </header>

      <main className="main-content">
        {screen === "home" && (
          <>
            <section className="welcome-row">
              <div>
                <p className="eyebrow">
                  <span className="eyebrow-dot" /> CBT STUDY SPACE
                </p>
                <h1>
                  오늘의 공부,
                  <br />
                  <span>한 문제부터.</span>
                </h1>
                <p className="welcome-copy">
                  기능사 시험 준비를 위한 나만의 퀴즈 공간이에요.
                  <br className="desktop-break" /> 과목을 골라 바로 연습을
                  시작할 수 있어요.
                </p>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="art-orbit orbit-one" />
                <div className="art-orbit orbit-two" />
                <div className="art-sheet">
                  <span className="sheet-check">
                    <Check size={18} />
                  </span>
                  <span className="sheet-line line-long" />
                  <span className="sheet-line" />
                  <span className="sheet-line line-short" />
                </div>
                <span className="art-spark spark-one">✳</span>
                <span className="art-spark spark-two">✳</span>
                <span className="art-number">01</span>
              </div>
            </section>

            <section className="stats-strip" aria-label="학습 현황">
              <div className="stat-item">
                <span className="stat-icon stat-green">
                  <BookOpen size={17} />
                </span>
                <span className="stat-label">등록된 문제</span>
                <strong>
                  {allQuestions.length}
                  <small> 문항</small>
                </strong>
              </div>
              <span className="stat-divider" />
              <div className="stat-item">
                <span className="stat-icon stat-yellow">
                  <Trophy size={17} />
                </span>
                <span className="stat-label">학습 과목</span>
                <strong>
                  {categories.length}
                  <small> 과목</small>
                </strong>
              </div>
              <span className="stat-divider" />
              <div className="stat-item">
                <span className="stat-icon stat-coral">
                  <Clock3 size={17} />
                </span>
                <span className="stat-label">오늘의 학습</span>
                <strong>준비 완료</strong>
              </div>
            </section>

            <section className="study-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow section-eyebrow">YOUR LIBRARY</p>
                  <h2>과목별 문제</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => fileInput.current?.click()}
                >
                  <FileUp size={16} /> 데이터 불러오기
                </button>
              </div>

              {notice && (
                <div className="notice" role="status">
                  {notice}
                  <button
                    className="notice-close"
                    onClick={() => setNotice("")}
                    aria-label="알림 닫기"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {categories.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <span className="empty-back" />
                    <span className="empty-page">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="empty-plus">+</span>
                  </div>
                  <div className="empty-copy">
                    <h3>아직 등록된 문제가 없어요</h3>
                    <p>
                      준비한 문제 파일을 불러오면
                      <br className="mobile-break" /> 과목별 퀴즈가 여기에
                      정리돼요.
                    </p>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => fileInput.current?.click()}
                  >
                    <FileUp size={17} /> 문제 데이터 가져오기{" "}
                    <ArrowRight size={16} />
                  </button>
                  <p className="format-hint">
                    JSON 파일 지원 · questions 배열에 문제 데이터 포함
                  </p>
                </div>
              ) : (
                <div className="category-grid">
                  <button
                    className="category-card all-card"
                    onClick={() => startQuiz(null)}
                  >
                    <span className="category-icon all-icon">
                      <Sparkles size={20} />
                    </span>
                    <span className="category-meta">전체 과목</span>
                    <strong>전체 문제 풀기</strong>
                    <span className="category-count">
                      {allQuestions.length}문항 <ChevronRight size={16} />
                    </span>
                  </button>
                  {categories.map((category, index) => {
                    const count = allQuestions.filter(
                      (question) => question.category === category,
                    ).length;
                    return (
                      <button
                        className="category-card"
                        onClick={() => startQuiz(category)}
                        key={category}
                      >
                        <span
                          className={`category-icon category-tone-${index % 3}`}
                        >
                          <BookOpen size={19} />
                        </span>
                        <span className="category-meta">
                          과목 {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>{category}</strong>
                        <span className="category-count">
                          {count}문항 <ChevronRight size={16} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="bottom-note">
              <span className="note-mark">i</span>
              <p>문제 파일은 이 기기에서만 열리며, 서버로 전송되지 않아요.</p>
              <button onClick={() => fileInput.current?.click()}>
                파일 형식 확인 <ArrowRight size={14} />
              </button>
            </section>
          </>
        )}

        {screen === "quiz" && currentQuestion && (
          <section className="quiz-view">
            <button className="back-link" onClick={goHome}>
              <ArrowLeft size={16} /> 과목 목록
            </button>
            <div className="quiz-heading">
              <div>
                <p className="eyebrow section-eyebrow">
                  {activeCategory ?? "전체 과목"}
                </p>
                <h1>문제 풀기</h1>
              </div>
              <span className="question-counter">
                {String(questionIndex + 1).padStart(2, "0")}{" "}
                <span>/ {String(quizQuestions.length).padStart(2, "0")}</span>
              </span>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${((questionIndex + 1) / quizQuestions.length) * 100}%`,
                }}
              />
            </div>
            <article className="question-panel">
              <div className="question-topline">
                <span>
                  QUESTION {String(questionIndex + 1).padStart(2, "0")}
                </span>
                {currentQuestion.difficulty && (
                  <span className="difficulty-tag">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>
              <h2>{currentQuestion.question}</h2>
              <div className="question-context">
                <div className="question-tags">
                  <span>{currentQuestion.title}</span>
                  <span>
                    {currentQuestion.subcategory ?? currentQuestion.category}
                  </span>
                  <span>{currentQuestion.day}일차</span>
                  <span>
                    {["", "기본", "보통", "심화"][currentQuestion.difficulty] ??
                      `난이도 ${currentQuestion.difficulty}`}
                  </span>
                </div>
                {currentQuestion.code && (
                  <pre className="code-block">
                    <span>{currentQuestion.code_language ?? "CODE"}</span>
                    <code>{currentQuestion.code}</code>
                  </pre>
                )}
                {currentQuestion.tables?.map((table) => (
                  <div className="data-table-wrap" key={table.name}>
                    <div className="data-table-title">{table.name}</div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {table.columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>
                                {cell === null ? "NULL" : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              <label className="answer-label" htmlFor="answer-input">
                내 답안
              </label>
              <textarea
                id="answer-input"
                className="answer-input"
                value={answers[questionIndex] ?? ""}
                onChange={(event) =>
                  setAnswers((previous) => ({
                    ...previous,
                    [questionIndex]: event.target.value,
                  }))
                }
                placeholder={
                  currentQuestion.type === "sql_write"
                    ? "SQL 문을 입력하세요"
                    : "답을 입력하세요"
                }
                rows={
                  currentQuestion.type === "sql_write"
                    ? 6
                    : ["short_answer", "fill_blank"].includes(
                          currentQuestion.type,
                        )
                      ? 2
                      : 4
                }
                spellCheck={false}
              />
            </article>
            <div className="quiz-controls">
              <button
                className="secondary-button"
                onClick={() =>
                  setQuestionIndex((index) => Math.max(0, index - 1))
                }
                disabled={questionIndex === 0}
              >
                <ArrowLeft size={16} /> 이전
              </button>
              <span className="answered-count">
                {Object.keys(answers).length} / {quizQuestions.length} 답변
              </span>
              {questionIndex < quizQuestions.length - 1 ? (
                <button
                  className="primary-button"
                  onClick={() => setQuestionIndex((index) => index + 1)}
                >
                  다음 문제 <ArrowRight size={16} />
                </button>
              ) : (
                <button className="primary-button" onClick={finishQuiz}>
                  결과 확인 <Check size={16} />
                </button>
              )}
            </div>
            {questionIndex < quizQuestions.length - 1 && (
              <button className="finish-link" onClick={finishQuiz}>
                지금 제출하기
              </button>
            )}
          </section>
        )}

        {screen === "result" && (
          <section className="result-view">
            <button className="back-link" onClick={goHome}>
              <ArrowLeft size={16} /> 과목 목록
            </button>
            <div className="result-hero">
              <span className="result-icon">
                <Trophy size={25} />
              </span>
              <p className="eyebrow section-eyebrow">PRACTICE COMPLETE</p>
              <h1>수고했어요!</h1>
              <p>{activeCategory ?? "전체 과목"} 퀴즈를 마쳤어요.</p>
              <div className="score-number">
                {quizQuestions.length
                  ? Math.round((correctCount / quizQuestions.length) * 100)
                  : 0}
                <span>점</span>
              </div>
              <div className="score-caption">
                {correctCount}개 정답 <span>·</span>{" "}
                {quizQuestions.length - correctCount}개 오답
              </div>
            </div>
            <div className="review-heading">
              <h2>문제 다시 보기</h2>
              <span>{quizQuestions.length}문항</span>
            </div>
            <div className="review-list">
              {quizQuestions.map((question, index) => {
                const isCorrect = isCorrectAnswer(
                  question,
                  answers[index] ?? "",
                );
                const correctAnswer = expectedAnswer(question);
                return (
                  <article
                    className="review-item"
                    key={`${index}-${question.question}`}
                  >
                    <div className="review-status">
                      <span
                        className={
                          isCorrect ? "status-correct" : "status-wrong"
                        }
                      >
                        {isCorrect ? <Check size={14} /> : <X size={14} />}
                      </span>
                      <span>Q{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="review-content">
                      <h3>
                        {question.title}: {question.question}
                      </h3>
                      <p
                        className={
                          isCorrect
                            ? "review-answer correct-text"
                            : "review-answer wrong-text"
                        }
                      >
                        {isCorrect ? "정답" : "내 답"}:{" "}
                        {answers[index] || "미응답"}
                      </p>
                      {!isCorrect && (
                        <p className="review-answer correct-text">
                          정답: {correctAnswer}
                        </p>
                      )}
                      {question.explanation && (
                        <p className="explanation">{question.explanation}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="result-actions">
              <button className="secondary-button" onClick={goHome}>
                과목 목록으로
              </button>
              <button
                className="primary-button"
                onClick={() => startQuiz(activeCategory)}
              >
                <RotateCcw size={16} /> 다시 풀기
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>
          기능사 랩 <span className="footer-separator">/</span> 나만의 시험 연습
          공간
        </span>
        <span>꾸준히 풀고, 확실하게 합격하기.</span>
      </footer>
      <input
        ref={fileInput}
        className="file-input"
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default App;
