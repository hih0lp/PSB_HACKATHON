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
    const [projectId, setProjectId] = useState('');
    const [courseName, setCourseName] = useState('')
    const { toggle, isActive } = useToggle();
    const [resetKey, setResetKey] = useState(0);

    const [arcticleName, setArticleName] = useState('');
    const [lessonText, setLessonText] = useState('');
    const [homeworkDescription, setHomeworkDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [lessons, setLessons] = useState([
        { 
            id: 1, 
            name: 'Урок 1', 
            elements: [],
            isActive: true
        }
    ]);

    useEffect(()=>{
        
        fetch('https://psbsmartedu.ru/courses/create-course', {
            method: 'POST',
            // headers: { 
            //     'Content-Type': 'application/json',
            // },
        })
        .then(response => {
            console.log('Статус ответа:', response.status);
            
            if (response.status === 404) {
                throw new Error('Сервер вернул 404');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return response.json();
        })
        .then(data => {
            console.log('Полученные данные при создании проекта:', data);
            
            if (data) {
                setProjectId(data);
            } else {
                throw new Error('Не удалось создать проект: пустой ответ');
            }
        })
        .catch(error => {
            console.error('Ошибка при создании проекта:', error);
        });
    }, [])
    
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
            
            // Для текстовых элементов
            if (element.type === 'text') {
                elementData.contentType = 'plain';
            }

            // Для домашних заданий
            if (element.type === 'homework') {
                elementData.blocksNextLesson = element.blocksNextLesson || false;
                elementData.contentType = 'homework';
            }
            
            // Для файлов добавляем дополнительную информацию
            if (element.type === 'file' && element.file) {
                elementData.fileType = element.fileType;
                
                // УПРОЩЕННЫЙ URL - убираем вложенность папок
                elementData.fileUrl = `/documents/${projectId}/${element.content}`;
                
                // Добавляем в общий список файлов
                allFiles.push({
                    id: `file_${element.id}`,
                    originalName: element.content,
                    storedName: element.content, // Используем оригинальное имя
                    type: element.fileType,
                    url: `/documents/${projectId}/${element.content}`,
                    lessonId: lesson.id,
                    lessonNumber: index + 1,
                    elementId: element.id,
                    file: element.file,
                    // Добавляем метаданные для удобства
                    metadata: {
                        projectId: projectId,
                        lessonName: lesson.name,
                        elementType: 'file'
                    }
                });
                
                // Добавляем информацию о размере файла если доступно
                if (element.file.size) {
                    elementData.fileSize = element.file.size;
                    elementData.fileSizeMB = (element.file.size / (1024 * 1024)).toFixed(2);
                }
            }
            
            return elementData;
        });
        
        return {
            id: lesson.id,
            order: index + 1,
            name: lesson.name,
            anchor: `lesson_${lesson.id}`,
            elements: lessonElements,
            // Добавляем статистику по уроку
            stats: {
                totalElements: lessonElements.length,
                headersCount: lessonElements.filter(el => el.type === 'header').length,
                textsCount: lessonElements.filter(el => el.type === 'text').length,
                filesCount: lessonElements.filter(el => el.type === 'file').length,
                homeworksCount: lessonElements.filter(el => el.type === 'homework').length
            }
        };
    });
    
    // Создаем основную структуру курса
    const courseJSON = {
        course: {
            id: courseId,
            name: courseName || 'Без названия',
            createdAt: now,
            updatedAt: now,
            version: '1.0',
            projectId: projectId // Добавляем projectId в основную информацию
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
                elementCount: lesson.elements.length,
                stats: lesson.stats
            })),
            // Быстрая навигация по уровням заголовков
            quickNav: {
                mainLessons: lessonsData.map(lesson => ({
                    id: lesson.id,
                    name: lesson.name,
                    anchor: lesson.anchor,
                    order: lesson.order
                })),
                allHeaders: anchors.filter(anchor => anchor.type === 'header')
            },
            // Общая статистика навигации
            stats: {
                totalAnchors: anchors.length,
                totalLessons: lessonsData.length,
                maxLevel: Math.max(...anchors.map(a => a.level), 0)
            }
        },
        
        // Информация о файлах (только метаданные, без самих файлов)
        files: allFiles.map(file => ({
            id: file.id,
            originalName: file.originalName,
            storedName: file.storedName,
            type: file.type,
            url: file.url,
            lessonId: file.lessonId,
            lessonNumber: file.lessonNumber,
            elementId: file.elementId,
            metadata: file.metadata,
            // Добавляем информацию для бэкенда
            uploadInfo: {
                projectId: projectId,
                targetPath: `documents/${projectId}`,
                fileName: file.originalName
            }
        })),
        
        // Общая структура курса
        structure: {
            totalLessons: lessons.length,
            totalElements: lessons.reduce((acc, lesson) => acc + lesson.elements.length, 0),
            totalHeaders: anchors.filter(anchor => anchor.type === 'header').length,
            totalTexts: lessons.reduce((acc, lesson) => acc + lesson.elements.filter(el => el.type === 'text').length, 0),
            totalFiles: allFiles.length,
            totalHomeworks: lessons.reduce((acc, lesson) => acc + lesson.elements.filter(el => el.type === 'homework').length, 0),
            hasImages: allFiles.some(file => file.type === 'image'),
            hasDocuments: allFiles.some(file => file.type === 'document'),
            fileTypes: [...new Set(allFiles.map(file => file.type))],
            // Статистика по типам контента
            contentBreakdown: {
                headers: anchors.filter(anchor => anchor.type === 'header').length,
                texts: lessons.reduce((acc, lesson) => acc + lesson.elements.filter(el => el.type === 'text').length, 0),
                homeworks: lessons.reduce((acc, lesson) => acc + lesson.elements.filter(el => el.type === 'homework').length, 0),
                images: allFiles.filter(file => file.type === 'image').length,
                documents: allFiles.filter(file => file.type === 'document').length,
                other: allFiles.filter(file => file.type === 'other').length
            }
        },
        
        // Метаданные для рендеринга
        renderConfig: {
            enableAnchors: true,
            smoothScroll: true,
            highlightOnNavigate: true,
            scrollOffset: 20,
            anchorPrefix: 'header_',
            // Настройки для файлов
            fileDisplay: {
                images: 'embedded',
                documents: 'download_link',
                maxImageWidth: '100%',
                maxImageHeight: '400px'
            }
        },
        
        // Информация о генерации
        meta: {
            generatedAt: now,
            generator: 'LessonForm React Component',
            dataVersion: '1.1',
            checksum: `checksum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
    };
    
    console.log('Сгенерирован JSON курса:', {
        lessons: courseJSON.structure.totalLessons,
        elements: courseJSON.structure.totalElements,
        files: courseJSON.structure.totalFiles,
        homeworks: courseJSON.structure.totalHomeworks,
        projectId: projectId
    });
    
    return {
        json: courseJSON,
        files: allFiles
    };
};


// Функция сохранения курса
const handleSaveCourse = async () => {
    try {
        // Проверяем projectId
        if (!projectId) {
            alert('Ошибка: не удалось получить ID проекта');
            return;
        }
        
        setIsLoading(true);
        const courseData = generateCourseJSON();

        console.log('Отправка данных на сервер:');
        console.log('Project ID:', projectId);
        console.log('Files count:', courseData.files.length);

        // 1. ОТПРАВКА JSON ДАННЫХ
        console.log('Отправка JSON данных...');
try {
    // Безопасное получение userId из куки
    const getuserIdFromCookie = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'userId') {
                return value;
            }
        }
        return null;
    };

    const userId = getuserIdFromCookie();
    
    if (!userId) {
        console.error('userId не найден в куках');
        return;
    }

    const response = await fetch(`https://psbsmartedu.ru/courses/subscribe-on/${projectId}/${userId}`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Подписка успешна');
    } catch (error) {
    console.error('Ошибка подписки:', error);
}


        let jsonResult;
        try {
            const jsonResponse = await fetch(`https://psbsmartedu.ru/courses/edit/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    content: JSON.stringify(courseData.json), 
                    id: projectId 
                })
            });

            console.log('Статус ответа JSON:', jsonResponse.status);
            
            if (!jsonResponse.ok) {
                const errorText = await jsonResponse.text();
                console.error('Ошибка при отправке JSON:', jsonResponse.status, errorText);
                throw new Error(`Ошибка при сохранении JSON: ${jsonResponse.status}`);
            }

            // Пробуем получить JSON, но если не получается - продолжаем
            try {
                jsonResult = await jsonResponse.json();
                console.log('Ответ от сервера (JSON):', jsonResult);
            } catch (jsonError) {
                console.warn('Сервер не вернул JSON, продолжаем без него:', jsonError);
                jsonResult = { success: true }; // Предполагаем успех
            }
        } catch (jsonError) {
            console.error('Ошибка при отправке JSON данных:', jsonError);
            // Продолжаем выполнение, возможно файлы все равно нужно отправить
        }

        // 2. ОТПРАВКА ФАЙЛОВ (если есть)
        // 2. ОТПРАВКА ФАЙЛОВ (если есть)
        if (courseData.files.length > 0) {
            console.log('Отправка файлов...');
            await uploadFilesSingleRequest(courseData.files, projectId);
        } else {
            console.log('Нет файлов для загрузки');
        }
    } catch (error) {
        console.error('Общая ошибка сохранения:', error);
        alert('Ошибка при сохранении курса: ' + error.message);
    } finally {
        setIsLoading(false);
    }
};

// Функция для отправки всех файлов одним запросом
const uploadFilesSingleRequest = async (files, projectId) => {
    console.log(`Отправка ${files.length} файлов одним запросом...`);
    
    const formData = new FormData();
    
    // ПРОСТО добавляем все файлы в форму
    files.forEach((fileObj) => {
        formData.append('files', fileObj.file, fileObj.originalName);
    });
    
    // Можно добавить projectId если нужно
    formData.append('projectId', projectId);

    const uploadUrl = `https://psbsmartedu.ru/documents/${projectId}`;
    console.log('URL для загрузки:', uploadUrl);

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });

        console.log('Статус ответа загрузки файлов:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка HTTP при загрузке файлов:', response.status, errorText);
            throw new Error(`Ошибка ${response.status} при загрузке файлов`);
        }

        console.log('Файлы успешно отправлены');
        return { success: true };

    } catch (error) {
        console.error('Ошибка при загрузке файлов:', error);
        throw error;
    }
};
// Запасной вариант: отправка файлов по одному
const uploadFilesOneByOne = async (files, projectId) => {
    console.log(`Отправка ${files.length} файлов по одному...`);
    
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        console.log(`Отправка файла ${i + 1}/${files.length}: ${fileObj.originalName}`);
        
        try {
            const formData = new FormData();
            formData.append('file', fileObj.file, fileObj.originalName);
            formData.append('projectId', projectId);
            formData.append('fileName', fileObj.originalName);

            const response = await fetch('https://psbsmartedu.ru/documents/upload-single', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                console.log(`Файл ${fileObj.originalName} успешно загружен`);
                results.push({ success: true, file: fileObj.originalName });
            } else {
                console.error(`Ошибка загрузки файла ${fileObj.originalName}:`, response.status);
                results.push({ success: false, file: fileObj.originalName, error: response.status });
            }
        } catch (error) {
            console.error(`Ошибка при загрузке файла ${fileObj.originalName}:`, error);
            results.push({ success: false, file: fileObj.originalName, error: error.message });
        }
    }

    const successfulUploads = results.filter(r => r.success).length;
    console.log(`Успешно загружено ${successfulUploads} из ${files.length} файлов`);
    
    if (successfulUploads === files.length) {
        alert('Все файлы успешно загружены!');
    } else {
        alert(`Загружено ${successfulUploads} из ${files.length} файлов. Некоторые файлы не были загружены.`);
    }
    
    return results;
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

    // Функция добавления домашнего задания (как обычный элемент)
    const addHomework = () => {
        if (homeworkDescription.trim()) {
            const newElement = {
                id: Date.now(),
                type: 'homework',
                content: homeworkDescription,
                blocksNextLesson: false // По умолчанию не блокирует
            };
            
            setLessons(prev => prev.map(lesson =>
                lesson.id === activeLessonId
                    ? { ...lesson, elements: [...lesson.elements, newElement] }
                    : lesson
            ));
            setHomeworkDescription('');
            toggle(4);
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

    // Функция обновления настройки блокировки для домашнего задания
    const updateHomeworkBlocking = (elementId, blocksNextLesson) => {
        setLessons(prev => prev.map(lesson =>
            lesson.id === activeLessonId
                ? {
                    ...lesson,
                    elements: lesson.elements.map(element =>
                        element.id === elementId && element.type === 'homework'
                            ? { ...element, blocksNextLesson }
                            : element
                    )
                }
                : lesson
        ));
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
                    <button className="saveAllButton" onClick={handleSaveCourse}>
                        {!isLoading?'Сохранить курс':'Загрузка..'}
                    </button>
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
                                        {element.type === 'homework' && (
                                            <textarea
                                                className="editTextarea"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                placeholder="Введите описание домашнего задания"
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
                                        {element.type === 'homework' && (
                                            <div className="homework-element">
                                                <div className="homework-header">
                                                    <h3 className="lessonHeader">📝 Домашнее задание</h3>
                                                    <div className="homework-controls">
                                                        <label className="blocking-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                checked={element.blocksNextLesson || false}
                                                                onChange={(e) => updateHomeworkBlocking(element.id, e.target.checked)}
                                                            />
                                                            Блокировать следующий урок
                                                        </label>
                                                    </div>
                                                </div>
                                                <p className="lessonText">{element.content}</p>
                                                {element.blocksNextLesson && (
                                                    <div className="blocking-notice">
                                                        ⚠️ Это задание должно быть выполнено для доступа к следующему уроку
                                                    </div>
                                                )}
                                            </div>
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
                    <button onClick={() => handleToggle(4)}>Добавить домашнее задание {isActive(4) && '✓'}</button>
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

                {isActive(4) && (
                    <section className="textAppendBlock" >
                    <textarea 
                        key={`input-5-${resetKey}`}
                        placeholder="Введите описание домашнего задания"
                        value={homeworkDescription} 
                        onChange={(e)=>{setHomeworkDescription(e.target.value)}}
                        rows="4"
                    />
                    <button onClick={addHomework}>Добавить задание</button>
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
