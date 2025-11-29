import { useState, useRef, useEffect } from "react";
import App from "../../App";
import './Lesson.css'
import Header from "../../Elements/Header/Header";

function useToggle() {
  const [activeElement, setActiveElement] = useState(null);

  const toggle = (id) => {
    setActiveElement(prev => prev === id ? null : id);
  };

  const isActive = (id) => activeElement === id;

  return { activeElement, toggle, isActive };
}

// Функция определения типа файла
const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('application/') || file.type.includes('document')) return 'document';
  return 'other';
};

export default function LessonForm(){
    const [courseName, setCourseName] = useState('')
    const { toggle, isActive } = useToggle();
    const [resetKey, setResetKey] = useState(0);

    const [arcticleName, setArticleName] = useState('');
    const [lessonText, setLessonText] = useState('');
    
    const [lessons, setLessons] = useState([
        { 
            id: 1, 
            name: 'Урок 1', 
            elements: [],
            isActive: true 
        }
    ]);
    
    const [activeLessonId, setActiveLessonId] = useState(1);
    const [previewHtml, setPreviewHtml] = useState('')
    const [file, setFile] = useState(null);
    
    const [editingElement, setEditingElement] = useState(null);
    const [editContent, setEditContent] = useState('');

    const lessonInputRefs = useRef({});
    const elementRefs = useRef({});

    const activeLesson = lessons.find(lesson => lesson.id === activeLessonId) || lessons[0];

    // Функция получения заголовков для урока
    const getHeadersForLesson = (lessonId) => {
        const lesson = lessons.find(l => l.id === lessonId);
        return lesson ? lesson.elements.filter(element => element.type === 'header') : [];
    };

    // Функция генерации JSON структуры курса с системой якорей
    const generateCourseJSON = () => {
        const courseId = `course_${Date.now()}`;
        const now = new Date().toISOString();
        
        // Собираем все файлы
        const allFiles = [];
        
        // Собираем якоря для навигации
        const anchors = [];
        
        const lessonsData = lessons.map((lesson, index) => {
            const lessonElements = lesson.elements.map(element => {
                const elementData = {
                    id: `element_${element.id}`,
                    type: element.type,
                    content: element.content
                };
                
                // Для заголовков добавляем якорь и уровень
                if (element.type === 'header') {
                    elementData.level = 2;
                    elementData.anchor = `header_${element.id}`;
                    
                    // Добавляем в систему якорей
                    anchors.push({
                        id: `anchor_${element.id}`,
                        type: 'header',
                        lessonId: lesson.id,
                        lessonName: lesson.name,
                        lessonOrder: index + 1,
                        elementId: element.id,
                        anchor: `header_${element.id}`,
                        title: element.content,
                        level: 2,
                        fullPath: `lesson_${lesson.id}#header_${element.id}`
                    });
                }
                
                // Для файлов добавляем дополнительную информацию
                if (element.type === 'file' && element.file) {
                    elementData.fileType = element.fileType;
                    elementData.fileUrl = `/files/${courseId}/lesson-${lesson.id}_${element.content}`;
                    
                    // Добавляем в общий список файлов
                    allFiles.push({
                        id: `file_${element.id}`,
                        originalName: element.content,
                        storedName: `lesson-${lesson.id}_${element.content}`,
                        type: element.fileType,
                        url: `/files/${courseId}/lesson-${lesson.id}_${element.content}`,
                        lessonId: lesson.id,
                        elementId: element.id,
                        file: element.file
                    });
                }
                
                return elementData;
            });
            
            return {
                id: lesson.id,
                order: index + 1,
                name: lesson.name,
                anchor: `lesson_${lesson.id}`,
                elements: lessonElements
            };
        });
        
        const courseJSON = {
            course: {
                id: courseId,
                name: courseName || 'Без названия',
                createdAt: now,
                updatedAt: now,
                version: '1.0'
            },
            lessons: lessonsData,
            
            // Система навигации с якорями
            navigation: {
                anchors: anchors,
                lessons: lessonsData.map(lesson => ({
                    id: lesson.id,
                    order: lesson.order,
                    name: lesson.name,
                    anchor: lesson.anchor,
                    headerCount: lesson.elements.filter(el => el.type === 'header').length,
                    elementCount: lesson.elements.length
                })),
                // Быстрая навигация по уровням заголовков
                quickNav: {
                    mainLessons: lessonsData.map(lesson => ({
                        id: lesson.id,
                        name: lesson.name,
                        anchor: lesson.anchor
                    })),
                    allHeaders: anchors.filter(anchor => anchor.type === 'header')
                }
            },
            
            files: allFiles.map(file => ({
                id: file.id,
                originalName: file.originalName,
                storedName: file.storedName,
                type: file.type,
                url: file.url,
                lessonId: file.lessonId,
                elementId: file.elementId
            })),
            
            structure: {
                totalLessons: lessons.length,
                totalElements: lessons.reduce((acc, lesson) => acc + lesson.elements.length, 0),
                totalHeaders: anchors.filter(anchor => anchor.type === 'header').length,
                totalFiles: allFiles.length,
                hasImages: allFiles.some(file => file.type === 'image'),
                hasDocuments: allFiles.some(file => file.type === 'document')
            },
            
            // Метаданные для рендеринга
            renderConfig: {
                enableAnchors: true,
                smoothScroll: true,
                highlightOnNavigate: true,
                scrollOffset: 20,
                anchorPrefix: 'header_'
            }
        };
        
        return {
            json: courseJSON,
            files: allFiles
        };
    };

    // Функция сохранения курса
    const handleSaveCourse = async () => {
        try {
            // Генерируем JSON структуру
            const courseData = generateCourseJSON();
            
            // Создаем FormData для отправки
            const formData = new FormData();
            
            // Добавляем JSON данные
            formData.append('courseData', JSON.stringify(courseData.json));
            
            // Добавляем файлы
            courseData.files.forEach(fileObj => {
                formData.append('files', fileObj.file, fileObj.storedName);
            });

            // Отправка на бэкенд
            const response = await fetch('/api/courses', {
                method: 'POST',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('Курс успешно сохранен!');
                
                // Скачиваем JSON для тестирования
                // downloadJSONFile(courseData.json, 'course.json');
                
                console.log('Структура курса:', courseData.json);
            } else {
                throw new Error('Ошибка при сохранении');
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении курса');
        }
    };

    // Функция скачивания JSON файла
    const downloadJSONFile = (jsonData, filename) => {
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Функция предпросмотра JSON
    const showPreview = () => {
        const courseData = generateCourseJSON();
        setPreviewHtml(JSON.stringify(courseData.json, null, 2));
    };

    // Остальные функции остаются без изменений
    const handleToggle = (id) => {
        if (!isActive(id)) {
            setResetKey(prev => prev + 1);
        }
        toggle(id);
    };

    const addNewLesson = () => {
        const newLessonId = Date.now();
        const newLesson = {
            id: newLessonId,
            name: `Урок ${lessons.length + 1}`,
            elements: [],
            isActive: false
        };
        setLessons(prev => prev.map(lesson => ({ ...lesson, isActive: false })).concat(newLesson));
        setActiveLessonId(newLessonId);
        
        setTimeout(() => {
            if (lessonInputRefs.current[newLessonId]) {
                lessonInputRefs.current[newLessonId].focus();
            }
        }, 0);
    };

    const switchLesson = (lessonId) => {
        setActiveLessonId(lessonId);
        setLessons(prev => prev.map(lesson => ({
            ...lesson,
            isActive: lesson.id === lessonId
        })));
    };

    const updateLessonName = (lessonId, newName) => {
        setLessons(prev => prev.map(lesson =>
            lesson.id === lessonId ? { ...lesson, name: newName } : lesson
        ));
    };

    const handleLessonInputClick = (lessonId, e) => {
        e.stopPropagation();
        switchLesson(lessonId);
        
        setTimeout(() => {
            if (lessonInputRefs.current[lessonId]) {
                lessonInputRefs.current[lessonId].focus();
            }
        }, 0);
    };

    const scrollToElement = (elementId) => {
        if (elementRefs.current[elementId]) {
            elementRefs.current[elementId].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            const element = elementRefs.current[elementId];
            element.classList.add('highlighted');
            setTimeout(() => {
                element.classList.remove('highlighted');
            }, 2000);
        }
    };

    const addHeader = () => {
        if (arcticleName.trim()) {
            const newElement = {
                id: Date.now(),
                type: 'header',
                content: arcticleName
            };
            
            setLessons(prev => prev.map(lesson =>
                lesson.id === activeLessonId
                    ? { ...lesson, elements: [...lesson.elements, newElement] }
                    : lesson
            ));
            setArticleName('');
            toggle(1);
        }
    };

    const addFile = () => {
        if (file) {
            const fileType = getFileType(file);
            const newElement = {
                id: Date.now(),
                type: 'file',
                content: file.name,
                file: file,
                fileType: fileType,
                url: URL.createObjectURL(file)
            };
            
            setLessons(prev => prev.map(lesson =>
                lesson.id === activeLessonId
                    ? { ...lesson, elements: [...lesson.elements, newElement] }
                    : lesson
            ));
            setFile(null);
            toggle(2);
        }
    };

    const addText = () => {
        if (lessonText.trim()) {
            const newElement = {
                id: Date.now(),
                type: 'text',
                content: lessonText
            };
            
            setLessons(prev => prev.map(lesson =>
                lesson.id === activeLessonId
                    ? { ...lesson, elements: [...lesson.elements, newElement] }
                    : lesson
            ));
            setLessonText('');
            toggle(3);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const removeElement = (elementId) => {
        setLessons(prev => prev.map(lesson =>
            lesson.id === activeLessonId
                ? { ...lesson, elements: lesson.elements.filter(element => element.id !== elementId) }
                : lesson
        ));
        if (editingElement?.id === elementId) {
            cancelEdit();
        }
    };

    const startEdit = (element) => {
        setEditingElement(element);
        setEditContent(element.content);
    };

    const saveEdit = () => {
        if (editContent.trim() && editingElement) {
            setLessons(prev => prev.map(lesson =>
                lesson.id === activeLessonId
                    ? {
                        ...lesson,
                        elements: lesson.elements.map(element =>
                            element.id === editingElement.id
                                ? { ...element, content: editContent }
                                : element
                        )
                    }
                    : lesson
            ));
            cancelEdit();
        }
    };

    const cancelEdit = () => {
        setEditingElement(null);
        setEditContent('');
    };

    const replaceFile = (elementId) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = (e) => {
            if (e.target.files[0]) {
                const newFile = e.target.files[0];
                const fileType = getFileType(newFile);
                
                setLessons(prev => prev.map(lesson =>
                    lesson.id === activeLessonId
                        ? {
                            ...lesson,
                            elements: lesson.elements.map(element =>
                                element.id === elementId
                                    ? {
                                        ...element,
                                        content: newFile.name,
                                        file: newFile,
                                        fileType: fileType,
                                        url: URL.createObjectURL(newFile)
                                    }
                                    : element
                            )
                        }
                        : lesson
                ));
            }
        };
        fileInput.click();
    };

    return(
        <App>
            <main className="course">
                <Header/>
                
                {/* Поле для названия курса */}
                <input 
                    className="courseNameInput"
                    placeholder="Название курса"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    style={{
                        width: '90%',
                        padding: '12px',
                        fontSize: '20px',
                        margin: '20px auto',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        display: 'block',
                        textAlign: 'center'
                    }}
                />
                
                <section className="courseAnchorList">
                    <div className="courseTitleInAnchor">
                        <span>{courseName || 'Название курса'}</span>
                    </div>
                    <span className="anchorListTitle">Содержание курса</span>
                    <nav className="lessonsNav">
                        {lessons.map(lesson => (
                            <div key={lesson.id} className="lessonNavItem">
                                <div 
                                    className={`lessonNavHeader ${lesson.isActive ? 'active' : ''}`}
                                    onClick={() => switchLesson(lesson.id)}
                                >
                                    <input
                                        ref={el => lessonInputRefs.current[lesson.id] = el}
                                        className="lessonNavInput"
                                        value={lesson.name}
                                        onChange={(e) => updateLessonName(lesson.id, e.target.value)}
                                        onClick={(e) => handleLessonInputClick(lesson.id, e)}
                                        onFocus={(e) => handleLessonInputClick(lesson.id, e)}
                                    />
                                </div>
                                <div className="lessonSubheaders">
                                    {getHeadersForLesson(lesson.id).map(header => (
                                        <a
                                            key={header.id}
                                            href={`#header-${header.id}`}
                                            className="subheaderLink"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (activeLessonId !== lesson.id) {
                                                    switchLesson(lesson.id);
                                                    setTimeout(() => scrollToElement(header.id), 100);
                                                } else {
                                                    scrollToElement(header.id);
                                                }
                                            }}
                                        >
                                            {header.content}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <span className="append" onClick={addNewLesson}>+</span>
                    </nav>
                    {/* <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}> */}
                        <button className="saveAllButton" onClick={handleSaveCourse}>
                            Сохранить курс
                        </button>
                        {/* <button className="previewButton" onClick={showPreview} style={{
                            background: '#28a745',
                            color: 'white',
                            padding: '10px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}>
                            Предпросмотр JSON
                        </button> */}
                    {/* </div> */}
                </section>

                <input 
                    className="lessonNameInput" 
                    placeholder="Название урока" 
                    type="text" 
                    value={activeLesson.name} 
                    onChange={(e) => updateLessonName(activeLessonId, e.target.value)}
                />

                <section className="lessonExample">
                    {activeLesson.elements.length === 0 ? (
                        <p className="emptyMessage">Добавьте элементы в урок</p>
                    ) : (
                        activeLesson.elements.map(element => (
                            <div 
                                key={element.id} 
                                ref={el => elementRefs.current[element.id] = el}
                                id={`header-${element.id}`}
                                className="lessonElement"
                            >
                                {editingElement?.id === element.id ? (
                                    <div className="editMode">
                                        {element.type === 'header' && (
                                            <input
                                                className="editInput"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                placeholder="Введите заголовок"
                                            />
                                        )}
                                        {element.type === 'text' && (
                                            <textarea
                                                className="editTextarea"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                placeholder="Введите текст"
                                                rows="4"
                                            />
                                        )}
                                        {element.type === 'file' && (
                                            <div className="fileEdit">
                                                {element.fileType === 'image' ? (
                                                    <div className="image-preview">
                                                        <img 
                                                            src={element.url} 
                                                            alt="Preview" 
                                                            style={{ maxWidth: '200px', maxHeight: '150px', marginBottom: '10px' }}
                                                        />
                                                        <span>🖼️ {element.content}</span>
                                                    </div>
                                                ) : (
                                                    <span>📎 {element.content}</span>
                                                )}
                                                <button 
                                                    className="replaceBtn"
                                                    onClick={() => replaceFile(element.id)}
                                                    style={{ marginLeft: '10px' }}
                                                >
                                                    Заменить файл
                                                </button>
                                            </div>
                                        )}
                                        <div className="editActions">
                                            <button className="saveBtn" onClick={saveEdit}>✓</button>
                                            <button className="cancelBtn" onClick={cancelEdit}>×</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {element.type === 'header' && (
                                            <h3 className="lessonHeader">{element.content}</h3>
                                        )}
                                        {element.type === 'text' && (
                                            <p className="lessonText">{element.content}</p>
                                        )}
                                        {element.type === 'file' && (
                                            <div className="lessonFile">
                                                {element.fileType === 'image' ? (
                                                    <div className="image-preview">
                                                        <img 
                                                            src={element.url} 
                                                            alt={element.content} 
                                                            style={{ maxWidth: '300px', maxHeight: '200px', marginBottom: '10px' }}
                                                        />
                                                        <span>🖼️ {element.content}</span>
                                                    </div>
                                                ) : (
                                                    <span>📎 {element.content}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="elementActions">
                                            <button 
                                                className="editBtn"
                                                onClick={() => startEdit(element)}
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                className="removeBtn"
                                                onClick={() => removeElement(element.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </section>
                
                <section className="appendElementBlock">
                    <button onClick={() => handleToggle(1)}>Добавить заголовок {isActive(1) && '✓'}</button>
                    <button onClick={() => handleToggle(2)}>Добавить вложение {isActive(2) && '✓'}</button>
                    <button onClick={() => handleToggle(3)}>Добавить текст {isActive(3) && '✓'}</button>
                </section>
                
                {isActive(1) && (
                    <section className="textAppendBlock">
                    <input 
                        key={`input-1-${resetKey}`}
                        placeholder="Заголовок"
                        value={arcticleName} 
                        onChange={(e)=>{setArticleName(e.target.value)}}
                    />
                    <button onClick={addHeader}>Добавить</button>
                    </section>
                )}
                
                {isActive(2) && (
                    <section className="textAppendBlock">
                    <input 
                        key={`input-2-${resetKey}`}
                        type="file"
                        placeholder="Отправить файл"
                        onChange={handleFileChange}
                    />
                    <button onClick={addFile}>Добавить</button>
                    </section>
                )}

                {isActive(3) && (
                    <section className="textAppendBlock" >
                    <textarea 
                        key={`input-4-${resetKey}`}
                        placeholder="Введите текст урока"
                        value={lessonText} 
                        onChange={(e)=>{setLessonText(e.target.value)}}
                        rows="4"
                    />
                    <button onClick={addText}>Добавить</button>
                    </section>
                )}

                {/* Модальное окно предпросмотра JSON */}
                {previewHtml && (
                    <div className="previewModal" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div className="previewContent" style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            width: '90%',
                            height: '90%',
                            position: 'relative'
                        }}>
                            <button onClick={() => setPreviewHtml('')} style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                zIndex: 1001
                            }}>
                                ×
                            </button>
                            <pre style={{ 
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                height: '100%',
                                overflow: 'auto',
                                background: '#f5f5f5',
                                padding: '20px',
                                borderRadius: '5px'
                            }}>
                                {previewHtml}
                            </pre>
                        </div>
                    </div>
                )}

            </main>
        </App>
    )
}