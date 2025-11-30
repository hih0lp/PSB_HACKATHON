import { useEffect, useState } from "react";
import App from "../../App";
import Header from "../../Elements/Header/Header";
import './Lesson.css';

export default function Lesson() {
    const projectId = window.location.href.split('id=')[1];
    const [courseData, setCourseData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeLessonId, setActiveLessonId] = useState(null);
    const [submissions, setSubmissions] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchCourseData() {
            try {
                setLoading(true);
                
                console.log('Загрузка данных для projectId:', projectId);
                
                // Получаем данные курса
                const courseResponse = await fetch(`https://psbsmartedu.ru/courses/get-course/${projectId}`);
                if (!courseResponse.ok) {
                    throw new Error('Ошибка загрузки данных курса');
                }
                const courseInfo = await courseResponse.json();
                
                console.log('Получены данные курса:', courseInfo);
                
                // Получаем документы
                const documentsResponse = await fetch(`https://psbsmartedu.ru/documents/${projectId}`);
                if (!documentsResponse.ok) {
                    console.warn('Ошибка загрузки документов, продолжаем без них');
                    setDocuments([]);
                } else {
                    const documentsData = await documentsResponse.json();
                    console.log('Получены документы:', documentsData);
                    setDocuments(documentsData);
                }
                
                // Загружаем отправленные задания
                await fetchSubmissions(projectId);
                
                // Парсим JSON контента
                let parsedData;
                if (courseInfo.content) {
                    try {
                        parsedData = JSON.parse(courseInfo.content);
                    } catch (parseError) {
                        console.error('Ошибка парсинга JSON:', parseError);
                        parsedData = courseInfo;
                    }
                } else {
                    parsedData = courseInfo;
                }
                
                console.log('Распарсенные данные:', parsedData);
                
                setCourseData(parsedData);
                
                // Устанавливаем первый урок как активный
                if (parsedData.lessons && parsedData.lessons.length > 0) {
                    setActiveLessonId(parsedData.lessons[0].id);
                }
                
            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        if (projectId) {
            fetchCourseData();
        }
    }, [projectId]);

    // Получение userId из куки
    const getUserIdFromCookie = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'userId') {
                return value;
            }
        }
        return null;
    };

    // Загрузка отправленных заданий
    const fetchSubmissions = async (courseId) => {
        try {
            const userId = getUserIdFromCookie();
            if (userId) {
                const response = await fetch(`https://psbsmartedu.ru/get-homework/${courseId}/${userId}`);
                if (response.ok) {
                    const submissionsData = await response.json();
                    const submissionsMap = {};
                    submissionsData.forEach(sub => {
                        submissionsMap[sub.lessonId] = sub;
                    });
                    setSubmissions(submissionsMap);
                    console.log('Загружены отправленные задания:', submissionsMap);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки отправленных заданий:', error);
        }
    };

    // Отправка домашнего задания
    const submitHomework = async (lessonId, file) => {
        try {
            const userId = getUserIdFromCookie();
            if (!userId) {
                alert('Пользователь не авторизован');
                return;
            }

            if (!file) {
                alert('Пожалуйста, выберите файл для отправки');
                return;
            }

            setIsSubmitting(true);

            const formData = new FormData();
            formData.append('file', file);

            console.log('Отправка домашнего задания:', {
                courseId: projectId,
                lessonId,
                userId,
                fileName: file.name
            });

            const response = await fetch(`https://psbsmartedu.ru/documents/save-homework/${projectId}/${lessonId}/${userId}`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Задание успешно отправлено:', result);
                alert('✅ Задание успешно отправлено!');
                await fetchSubmissions(projectId);
            } else {
                console.error('Ошибка при отправке задания:', response.status);
                alert('❌ Ошибка при отправке задания');
            }
        } catch (error) {
            console.error('Ошибка отправки задания:', error);
            alert('❌ Ошибка при отправке задания');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Функция для получения URL файла
    const getFileUrl = (element) => {
        const fileName = element.content;
        
        if (element.fileUrl) {
            if (element.fileUrl.startsWith('/')) {
                return `https://psbsmartedu.ru${element.fileUrl}`;
            }
            return element.fileUrl;
        }
        
        if (documents && documents.length > 0) {
            const document = documents.find(doc => {
                const pathParts = doc.split('/');
                const docFileName = pathParts[pathParts.length - 1];
                return docFileName === fileName;
            });
            
            if (document) {
                return `https://psbsmartedu.ru${document}`;
            }
        }
        
        return `https://psbsmartedu.ru/documents/${projectId}/${fileName}`;
    };

    // Функция для скролла к элементу
    const scrollToElement = (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            element.classList.add('highlighted');
            setTimeout(() => {
                element.classList.remove('highlighted');
            }, 2000);
        }
    };

    // Функция для переключения уроков
    const switchLesson = (lessonId) => {
        // Проверяем блокировку для целевого урока
        const targetLessonIndex = courseData.lessons?.findIndex(lesson => lesson.id === lessonId) || 0;
        if (targetLessonIndex > 0) {
            const previousLesson = courseData.lessons[targetLessonIndex - 1];
            const previousHomework = previousLesson.elements?.find(el => el.type === 'homework');
            
            if (previousHomework?.blocksNextLesson && !isHomeworkCompleted(previousLesson.id)) {
                alert('❌ Для перехода к этому уроку необходимо выполнить домашнее задание из предыдущего урока');
                return;
            }
        }
        
        setActiveLessonId(lessonId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Компонент для домашнего задания
    const HomeworkSection = ({ lessonId, homeworkElement }) => {
        const submission = submissions[lessonId];
        const [file, setFile] = useState(null);
        const [fileName, setFileName] = useState('');

        if (!homeworkElement) return null;

        const handleFileChange = (e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) {
                setFile(selectedFile);
                setFileName(selectedFile.name);
            }
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            await submitHomework(lessonId, file);
        };

        const handleRemoveFile = () => {
            setFile(null);
            setFileName('');
        };

        return (
            <div style={{
                marginTop: '20px',
                padding: '25px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
            }}>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    📝 Домашнее задание
                    {homeworkElement.blocksNextLesson && (
                        <span style={{
                            fontSize: '12px',
                            background: '#dc2626',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '500'
                        }}>
                            Обязательное
                        </span>
                    )}
                </h3>

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px' }}>
                        {homeworkElement.content}
                    </p>
                    {homeworkElement.blocksNextLesson && (
                        <div style={{
                            padding: '10px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#dc2626'
                        }}>
                            ⚠️ Это задание должно быть выполнено для доступа к следующему уроку
                        </div>
                    )}
                </div>

                {submission ? (
                    <div style={{
                        padding: '15px',
                        background: '#ecfdf5',
                        borderRadius: '8px',
                        border: '1px solid #10b981'
                    }}>
                        <h4 style={{ color: '#065f46', marginBottom: '10px', fontWeight: '600' }}>
                            ✅ Задание отправлено
                        </h4>
                        {submission.fileUrl && (
                            <div style={{ marginBottom: '10px' }}>
                                <a 
                                    href={`https://psbsmartedu.ru${submission.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ 
                                        color: '#059669',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    📎 {submission.fileName || 'Прикрепленный файл'}
                                </a>
                            </div>
                        )}
                        <p style={{ fontSize: '12px', color: '#047857', marginTop: '10px' }}>
                            Отправлено: {new Date(submission.submittedAt).toLocaleString('ru-RU')}
                        </p>
                        {submission.grade && (
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#059669', marginTop: '10px' }}>
                                Оценка: {submission.grade}
                            </p>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '10px', 
                                fontWeight: '500',
                                fontSize: '16px'
                            }}>
                                Прикрепите файл с выполненным заданием:
                            </label>
                            
                            {!file ? (
                                <div style={{
                                    border: '2px dashed #d1d5db',
                                    borderRadius: '8px',
                                    padding: '30px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    background: '#f9fafb'
                                }}
                                onClick={() => document.getElementById(`file-input-${lessonId}`).click()}
                                >
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
                                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '5px' }}>
                                        Нажмите для выбора файла
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                        Поддерживаются любые форматы файлов
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '15px',
                                    background: '#ecfdf5',
                                    borderRadius: '8px',
                                    border: '1px solid #10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '20px' }}>📎</span>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{fileName}</div>
                                            <div style={{ fontSize: '12px', color: '#059669' }}>
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '18px',
                                            cursor: 'pointer',
                                            color: '#dc2626',
                                            padding: '5px'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            
                            <input
                                id={`file-input-${lessonId}`}
                                type="file"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !file}
                            style={{
                                padding: '12px 24px',
                                background: isSubmitting || !file ? '#9ca3af' : '#2563EB',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isSubmitting || !file ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.3s'
                            }}
                        >
                            {isSubmitting ? '📤 Отправка...' : '📤 Отправить задание'}
                        </button>
                    </form>
                )}
            </div>
        );
    };

    // Функция для рендеринга элементов активного урока
    const renderActiveLesson = () => {
        if (!courseData || !activeLessonId) return null;
        
        const activeLesson = courseData.lessons.find(lesson => lesson.id === activeLessonId);
        if (!activeLesson) return null;

        // Находим домашнее задание в элементах урока
        const homeworkElement = activeLesson.elements?.find(element => element.type === 'homework');

        return (
            <section key={activeLesson.id} style={{ marginBottom: '50px' }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    marginBottom: '30px',
                    color: '#1f2937',
                    borderBottom: '3px solid #2563EB',
                    paddingBottom: '15px'
                }}>
                    {activeLesson.order}. {activeLesson.name}
                </h1>

                <div className="lessonExample">
                    {activeLesson.elements?.length > 0 ? (
                        activeLesson.elements.map(element => renderElement(element, activeLesson.id))
                    ) : (
                        <p className="emptyMessage">В этом уроке пока нет содержимого</p>
                    )}
                </div>

                {/* Блок домашнего задания */}
                {homeworkElement && (
                    <HomeworkSection 
                        lessonId={activeLesson.id} 
                        homeworkElement={homeworkElement} 
                    />
                )}
            </section>
        );
    };

    // Функция для рендеринга отдельных элементов
    const renderElement = (element, lessonId) => {
        const elementId = `element_${element.id}`;
        
        switch (element.type) {
            case 'header':
                return (
                    <div key={element.id} id={element.anchor || elementId} className="lessonElement">
                        <h2 className="lessonHeader" style={{ fontSize: '22px', marginBottom: '15px' }}>
                            {element.content}
                        </h2>
                    </div>
                );
                
            case 'text':
                return (
                    <div key={element.id} id={elementId} className="lessonElement">
                        <p className="lessonText" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                            {element.content}
                        </p>
                    </div>
                );

            case 'homework':
                // Домашнее задание рендерится как статичный блок
                return (
                    <div key={element.id} id={elementId} className="lessonElement">
                        <div style={{
                            padding: '20px',
                            background: '#fffbf0',
                            borderRadius: '8px',
                            border: '2px solid #f59e0b',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '15px',
                                color: '#92400e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                📝 Домашнее задание
                                {element.blocksNextLesson && (
                                    <span style={{
                                        fontSize: '11px',
                                        background: '#dc2626',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        fontWeight: '500'
                                    }}>
                                        Обязательное
                                    </span>
                                )}
                            </h3>
                            <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#78350f' }}>
                                {element.content}
                            </p>
                            {element.blocksNextLesson && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '8px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    color: '#dc2626'
                                }}>
                                    ⚠️ Для доступа к следующему уроку необходимо выполнить это задание
                                </div>
                            )}
                        </div>
                    </div>
                );
                
            case 'file':
                if (element.fileType === 'image') {
                    const imageUrl = getFileUrl(element);
                    
                    return (
                        <div key={element.id} id={elementId} className="lessonElement">
                            <div className="lessonFile">
                                <img 
                                    src={imageUrl} 
                                    alt={element.content}
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '400px',
                                        borderRadius: '8px',
                                        display: 'block',
                                        margin: '0 auto',
                                        border: '1px solid #e5e7eb'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    );
                } else {
                    const fileUrl = getFileUrl(element);
                    
                    return (
                        <div key={element.id} id={elementId} className="lessonElement">
                            <div className="lessonFile">
                                <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        textDecoration: 'none',
                                        color: '#2563EB',
                                        padding: '10px 15px',
                                        border: '1px solid #2563EB',
                                        borderRadius: '6px',
                                        transition: 'all 0.3s',
                                        background: 'transparent'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#2563EB';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.color = '#2563EB';
                                    }}
                                >
                                    📎 {element.content}
                                    {element.fileSizeMB && (
                                        <span style={{ fontSize: '12px', opacity: '0.7' }}>
                                            ({element.fileSizeMB} MB)
                                        </span>
                                    )}
                                </a>
                            </div>
                        </div>
                    );
                }
                
            default:
                return (
                    <div key={element.id} id={elementId} className="lessonElement">
                        <div style={{ color: '#666', fontStyle: 'italic' }}>
                            Неизвестный тип элемента: {element.type}
                        </div>
                    </div>
                );
        }
    };

    // Проверка, есть ли домашнее задание в уроке
    const hasHomework = (lessonId) => {
        const lesson = courseData?.lessons?.find(lesson => lesson.id === lessonId);
        return lesson?.elements?.some(element => element.type === 'homework');
    };

    // Проверка, выполнено ли домашнее задание
    const isHomeworkCompleted = (lessonId) => {
        return !!submissions[lessonId];
    };

    // Проверка, заблокирован ли урок из-за непройденного домашнего задания
    const isLessonLocked = (lessonId) => {
        const lessonIndex = courseData.lessons?.findIndex(lesson => lesson.id === lessonId) || 0;
        if (lessonIndex === 0) return false; // Первый урок никогда не заблокирован
        
        const previousLesson = courseData.lessons[lessonIndex - 1];
        const previousHomework = previousLesson.elements?.find(el => el.type === 'homework');
        
        return previousHomework?.blocksNextLesson && !isHomeworkCompleted(previousLesson.id);
    };

    if (loading) {
        return (
            <App>
                <main className="course">
                    <Header />
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '50vh',
                        fontSize: '18px',
                        color: '#666'
                    }}>
                        Загрузка курса...
                    </div>
                </main>
            </App>
        );
    }

    if (error) {
        return (
            <App>
                <main className="course">
                    <Header />
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '50vh',
                        fontSize: '18px',
                        color: '#dc2626'
                    }}>
                        Ошибка: {error}
                    </div>
                </main>
            </App>
        );
    }

    if (!courseData) {
        return (
            <App>
                <main className="course">
                    <Header />
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '50vh',
                        fontSize: '18px',
                        color: '#666'
                    }}>
                        Курс не найден
                    </div>
                </main>
            </App>
        );
    }

    const activeLesson = courseData.lessons?.find(lesson => lesson.id === activeLessonId);
    const currentLessonIndex = courseData.lessons?.findIndex(lesson => lesson.id === activeLessonId) || 0;
    const hasActiveHomework = hasHomework(activeLessonId);
    const isActiveHomeworkCompleted = isHomeworkCompleted(activeLessonId);

    return (
        <App>
            <main className="course">
                <Header />
                
                <section className="courseAnchorList">
                    <div className="courseTitleInAnchor">
                        <span>{courseData.course?.name || 'Название курса'}</span>
                    </div>
                    
                    <span className="anchorListTitle" style={{ display: 'block', marginBottom: '15px', fontWeight: '600' }}>
                        Уроки курса
                    </span>
                    
                    <nav className="lessonsNav">
                        {courseData.lessons?.map(lesson => {
                            const isLocked = isLessonLocked(lesson.id);
                            const hasHw = hasHomework(lesson.id);
                            const isCompleted = isHomeworkCompleted(lesson.id);
                            
                            return (
                                <div key={lesson.id} className="lessonNavItem">
                                    <div 
                                        className={`lessonNavHeader ${activeLessonId === lesson.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                                        onClick={() => !isLocked && switchLesson(lesson.id)}
                                        style={{ 
                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                            opacity: isLocked ? 0.6 : 1
                                        }}
                                    >
                                        <span className="lessonNavInput">
                                            {lesson.order}. {lesson.name}
                                            {isLocked && (
                                                <span style={{ 
                                                    marginLeft: '8px', 
                                                    fontSize: '12px',
                                                    color: '#dc2626',
                                                    fontWeight: '600'
                                                }} title="Урок заблокирован">
                                                    🔒
                                                </span>
                                            )}
                                            {hasHw && !isLocked && (
                                                <span style={{ 
                                                    marginLeft: '8px', 
                                                    fontSize: '12px',
                                                    color: isCompleted ? '#059669' : '#dc2626',
                                                    fontWeight: '600'
                                                }}>
                                                    {isCompleted ? '✅' : '📝'}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    
                                    {activeLessonId === lesson.id && courseData.navigation?.anchors && !isLocked && (
                                        <div className="lessonSubheaders">
                                            {courseData.navigation.anchors
                                                .filter(anchor => anchor.lessonId === lesson.id)
                                                .map(anchor => (
                                                    <a
                                                        key={anchor.id}
                                                        href={`#${anchor.anchor}`}
                                                        className="subheaderLink"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            scrollToElement(anchor.anchor);
                                                        }}
                                                    >
                                                        {anchor.title}
                                                    </a>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {activeLesson && (
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            fontSize: '14px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                                Текущий урок
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                                <strong>Элементов:</strong> {activeLesson.elements?.length || 0}
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                                <strong>Файлов:</strong> {activeLesson.stats?.filesCount || 0}
                            </div>
                            {hasHomework(activeLesson.id) && (
                                <div style={{ 
                                    color: isHomeworkCompleted(activeLesson.id) ? '#059669' : '#dc2626', 
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    {isHomeworkCompleted(activeLesson.id) ? '✅' : '📝'}
                                    {isHomeworkCompleted(activeLesson.id) ? 'Задание выполнено' : 'Есть домашнее задание'}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <div style={{ 
                    marginRight: '200px', 
                    padding: '20px 40px',
                    maxWidth: '1200px',
                    minHeight: 'calc(100vh - 80px)'
                }}>
                    <div style={{
                        marginBottom: '30px',
                        paddingBottom: '15px',
                        borderBottom: '2px solid #e5e7eb'
                    }}>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '5px'
                        }}>
                            {courseData.course?.name || 'Название курса'}
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>
                            {courseData.structure?.totalLessons} уроков • {courseData.structure?.totalElements} элементов
                        </p>
                    </div>

                    {renderActiveLesson()}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '50px',
                        paddingTop: '20px',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        <button
                            onClick={() => {
                                if (currentLessonIndex > 0) {
                                    switchLesson(courseData.lessons[currentLessonIndex - 1].id);
                                }
                            }}
                            disabled={currentLessonIndex === 0}
                            style={{
                                padding: '12px 24px',
                                background: currentLessonIndex === 0 ? '#f3f4f6' : '#2563EB',
                                color: currentLessonIndex === 0 ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: currentLessonIndex === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.3s'
                            }}
                        >
                            ← Предыдущий урок
                        </button>

                        <div style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            fontWeight: '500'
                        }}>
                            Урок {currentLessonIndex + 1} из {courseData.lessons?.length}
                        </div>

                        <button
                            onClick={() => {
                                if (currentLessonIndex < courseData.lessons.length - 1) {
                                    // Проверяем блокировку следующего урока
                                    const homeworkElement = activeLesson.elements?.find(el => el.type === 'homework');
                                    if (homeworkElement?.blocksNextLesson && !isActiveHomeworkCompleted) {
                                        alert('❌ Для перехода к следующему уроку необходимо выполнить домашнее задание');
                                        return;
                                    }
                                    switchLesson(courseData.lessons[currentLessonIndex + 1].id);
                                }
                            }}
                            disabled={currentLessonIndex === courseData.lessons.length - 1}
                            style={{
                                padding: '12px 24px',
                                background: currentLessonIndex === courseData.lessons.length - 1 ? '#f3f4f6' : '#2563EB',
                                color: currentLessonIndex === courseData.lessons.length - 1 ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: currentLessonIndex === courseData.lessons.length - 1 ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.3s'
                            }}
                        >
                            Следующий урок →
                        </button>
                    </div>
                </div>
            </main>
        </App>
    );
}