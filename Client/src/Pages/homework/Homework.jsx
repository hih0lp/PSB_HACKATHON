import { useEffect, useState } from "react";
import App from "../../App";
import Header from "../../Elements/Header/Header";
import './Homework.css';

export default function HomeworkCheck() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [grade, setGrade] = useState(5);
    const [feedback, setFeedback] = useState("");

    // Локальное хранилище для оцененных работ
    const [gradedSubmissions, setGradedSubmissions] = useState(() => {
        const saved = localStorage.getItem('gradedHomeworkSubmissions');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        async function fetchSubmissions() {
            try {
                setLoading(true);
                
                // Получаем courseId из URL или другим способом
                const courseId = new URLSearchParams(window.location.search).get('courseId');
                
                if (!courseId) {
                    throw new Error('ID курса не указан');
                }

                // Загружаем все отправленные задания для курса
                const response = await fetch(`https://psbsmartedu.ru/homeworks/course/${courseId}/submissions`);
                if (!response.ok) {
                    throw new Error('Ошибка загрузки заданий');
                }
                
                const submissionsData = await response.json();
                console.log('Получены отправленные задания:', submissionsData);
                
                // Фильтруем только те, которые еще не оценены локально
                const ungradedSubmissions = submissionsData.filter(sub => 
                    !gradedSubmissions.find(graded => graded.id === sub.id)
                );
                setSubmissions(ungradedSubmissions);
                
            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchSubmissions();
    }, [gradedSubmissions]);

    // Функция для локальной оценки задания
    const gradeSubmission = (submissionId) => {
        const gradedSubmission = {
            ...selectedSubmission,
            grade: grade,
            feedback: feedback,
            gradedAt: new Date().toISOString(),
            gradedBy: "Преподаватель" // Можно заменить на реальное имя пользователя
        };

        // Сохраняем в локальное хранилище
        const updatedGradedSubmissions = [...gradedSubmissions, gradedSubmission];
        setGradedSubmissions(updatedGradedSubmissions);
        localStorage.setItem('gradedHomeworkSubmissions', JSON.stringify(updatedGradedSubmissions));

        // Убираем оцененное задание из списка
        setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
        setSelectedSubmission(null);
        setGrade(5);
        setFeedback("");
        
        alert('Оценка сохранена локально!');
    };

    // Функция для загрузки деталей задания
    const loadSubmissionDetails = async (submission) => {
        try {
            // Загружаем информацию о курсе и уроке для контекста
            const courseResponse = await fetch(`https://psbsmartedu.ru/courses/get-course/${submission.courseId}`);
            if (courseResponse.ok) {
                const courseData = await courseResponse.json();
                submission.courseName = courseData.course?.name || 'Неизвестный курс';
            }

            // Загружаем информацию о домашнем задании
            const homeworkResponse = await fetch(`https://psbsmartedu.ru/homeworks/lesson/${submission.lessonId}`);
            if (homeworkResponse.ok) {
                const homeworkData = await homeworkResponse.json();
                submission.homeworkDescription = homeworkData.description;
            }

            setSelectedSubmission(submission);
        } catch (error) {
            console.error('Ошибка загрузки деталей:', error);
            setSelectedSubmission(submission); // Все равно показываем, даже если детали не загрузились
        }
    };

    // Функция для просмотра ранее оцененных работ
    const viewGradedSubmissions = () => {
        console.log('Оцененные работы:', gradedSubmissions);
        alert(`У вас ${gradedSubmissions.length} оцененных работ. Проверьте консоль для деталей.`);
    };

    if (loading) {
        return (
            <App>
                <main className="homework-check">
                    <Header headerText="Проверка домашних заданий" />
                    <div className="loading-container">
                        <p>Загрузка заданий...</p>
                    </div>
                </main>
            </App>
        );
    }

    if (error) {
        return (
            <App>
                <main className="homework-check">
                    <Header headerText="Проверка домашних заданий" />
                    <div className="error-container">
                        <p>Ошибка: {error}</p>
                    </div>
                </main>
            </App>
        );
    }

    return (
        <App>
            <main className="homework-check">
                <Header headerText="Проверка домашних заданий" />
                
                <div className="homework-check-actions">
                    <button 
                        className="view-graded-button"
                        onClick={viewGradedSubmissions}
                    >
                        Просмотр оцененных работ ({gradedSubmissions.length})
                    </button>
                </div>
                
                <div className="homework-check-container">
                    {/* Список заданий для проверки */}
                    <div className="submissions-list">
                        <h2>Задания для проверки ({submissions.length})</h2>
                        
                        {submissions.length === 0 ? (
                            <div className="empty-state">
                                <p>🎉 Все задания проверены!</p>
                                <p>Нет непроверенных домашних заданий.</p>
                            </div>
                        ) : (
                            <div className="submissions-grid">
                                {submissions.map((submission) => (
                                    <div 
                                        key={submission.id} 
                                        className={`submission-card ${selectedSubmission?.id === submission.id ? 'selected' : ''}`}
                                        onClick={() => loadSubmissionDetails(submission)}
                                    >
                                        <div className="submission-header">
                                            <h3>Задание от {submission.userName || `Пользователь ${submission.userId}`}</h3>
                                            <span className="submission-date">
                                                {new Date(submission.submittedAt).toLocaleDateString('ru-RU')}
                                            </span>
                                        </div>
                                        
                                        <div className="submission-info">
                                            <p><strong>Урок:</strong> {submission.lessonName || `Урок ${submission.lessonId}`}</p>
                                            <p><strong>Курс:</strong> {submission.courseName || `Курс ${submission.courseId}`}</p>
                                        </div>
                                        
                                        <div className="submission-preview">
                                            {submission.text && (
                                                <p className="text-preview">
                                                    {submission.text.length > 100 
                                                        ? `${submission.text.substring(0, 100)}...` 
                                                        : submission.text
                                                    }
                                                </p>
                                            )}
                                            {submission.fileUrl && (
                                                <span className="file-indicator">📎 Прикреплен файл</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Панель проверки */}
                    {selectedSubmission && (
                        <div className="grading-panel">
                            <div className="grading-header">
                                <h2>Проверка задания</h2>
                                <button 
                                    className="close-button"
                                    onClick={() => setSelectedSubmission(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="submission-details">
                                <div className="student-info">
                                    <h3>Студент: {selectedSubmission.userName || `Пользователь ${selectedSubmission.userId}`}</h3>
                                    <p>Отправлено: {new Date(selectedSubmission.submittedAt).toLocaleString('ru-RU')}</p>
                                </div>

                                {selectedSubmission.homeworkDescription && (
                                    <div className="homework-description">
                                        <h4>Описание задания:</h4>
                                        <p>{selectedSubmission.homeworkDescription}</p>
                                    </div>
                                )}

                                <div className="submission-content">
                                    <h4>Ответ студента:</h4>
                                    {selectedSubmission.text && (
                                        <div className="text-response">
                                            <p>{selectedSubmission.text}</p>
                                        </div>
                                    )}
                                    
                                    {selectedSubmission.fileUrl && (
                                        <div className="file-response">
                                            <h5>Прикрепленный файл:</h5>
                                            <a 
                                                href={`https://psbsmartedu.ru${selectedSubmission.fileUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="file-download"
                                            >
                                                📎 Скачать файл
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grading-form">
                                <h4>Оценка работы:</h4>
                                
                                <div className="grade-selector">
                                    <label>Оценка (1-5 баллов):</label>
                                    <div className="grade-buttons">
                                        {[1, 2, 3, 4, 5].map((score) => (
                                            <button
                                                key={score}
                                                type="button"
                                                className={`grade-button ${grade === score ? 'selected' : ''}`}
                                                onClick={() => setGrade(score)}
                                            >
                                                {score}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="feedback-input">
                                    <label htmlFor="feedback">Комментарий (опционально):</label>
                                    <textarea
                                        id="feedback"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Введите комментарий к работе..."
                                        rows="4"
                                    />
                                </div>

                                <button
                                    className="submit-grade-button"
                                    onClick={() => gradeSubmission(selectedSubmission.id)}
                                >
                                    Сохранить оценку локально
                                </button>
                            </div>
                        </div>
                    )}

                    {!selectedSubmission && submissions.length > 0 && (
                        <div className="selection-prompt">
                            <p>Выберите задание для проверки из списка слева</p>
                        </div>
                    )}
                </div>
            </main>
        </App>
    );
}