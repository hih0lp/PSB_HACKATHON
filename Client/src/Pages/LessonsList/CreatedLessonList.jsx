import App from "../../App";
import Header from "../../Elements/Header/Header";
import './LessonsList.css'
import { useState, useEffect } from "react";

export default function CreatedLessonList(){

    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        async function fetchData() {
            try {
                const userId = document.cookie.split('userId=')[1].split(';')[0]
                const response = await fetch(`https://psbsmartedu.ru/courses/get-tutor-courses/${userId}`)
                const courses = await response.json()
                setData(courses)
            } catch (error) {
                console.error('Ошибка загрузки данных:', error)
                setData([])
            } finally {
                setLoading(false)
            }
        }
       fetchData()
    },[])

    // Функция для извлечения названия курса из JSON строки
    const getCourseName = (content) => {
        try {
            const parsedContent = JSON.parse(content);
            return parsedContent.course?.name || 'Название курса';
        } catch (error) {
            return 'Название курса';
        }
    }

    // Функция для извлечения информации о курсе
    const getCourseInfo = (content) => {
        try {
            const parsedContent = JSON.parse(content);
            const structure = parsedContent.structure;
            
            if (structure) {
                // Форматируем дату создания
                const createdAt = new Date(parsedContent.course?.createdAt).toLocaleDateString('ru-RU');
                
                // Создаем описание курса
                const lessonsCount = structure.totalLessons || 0;
                const elementsCount = structure.totalElements || 0;
                const filesCount = structure.totalFiles || 0;
                
                return `${lessonsCount} уроков • ${elementsCount} материалов • Создан ${createdAt}`;
            }
            
            return 'Информация о курсе';
        } catch (error) {
            return 'Информация о курсе';
        }
    }

    if (loading) {
        return (
            <App>
                <section className="LessonList">
                    <Header headerText='Курсы, которые вы создали'/>
                    <div className='tilesBlock'>
                        <p>Загрузка ваших курсов...</p>
                    </div>
                </section>
            </App>
        )
    }

    if (!data || data.length === 0) {
        return (
            <App>
                <section className="LessonList">
                    <Header headerText='Курсы, которые вы создали'/>
                    <div className='tilesBlock'>
                        <p>Вы еще не создали ни одного курса</p>
                    </div>
                </section>
            </App>
        )
    }

    return(
        <App>
            <section className="LessonList">
                <Header headerText='Курсы, которые вы создали'/>
                    <div className='tilesBlock'>
                        {data.map((course) => (
                            <div key={course.id} className='tile'>
                                <div>
                                    <div className="logoPart">
                                        <svg width="70" height="75" viewBox="0 0 70 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect y="5" width="70" height="70" rx="11" fill="#94A7E1" fillOpacity="0.89"/>
                                        <path d="M44.5234 20.8984C43.7891 20.4766 42.9375 20.2656 41.9688 20.2656C39.375 20.2656 38.0781 21.9219 38.0781 25.2344V55.4922C38.0781 57.8984 37.2422 59.8203 35.5703 61.2578C33.8984 62.6953 31.8281 63.4141 29.3594 63.4141C28.0312 63.4141 26.9766 63.2578 26.1953 62.9453V58.4688C26.9297 58.875 27.7578 59.0781 28.6797 59.0781C31.3047 59.0781 32.6172 57.4219 32.6172 54.1094V23.8984C32.6172 21.4609 33.4453 19.5234 35.1016 18.0859C36.7578 16.6484 38.8203 15.9297 41.2891 15.9297C42.6641 15.9297 43.7422 16.1172 44.5234 16.4922V20.8984Z" fill="#2563EB"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className='tileBase'>
                                <div className="textBlock">
                                    <span>{getCourseName(course.content)}</span>
                                    <p>{getCourseInfo(course.content)}</p>
                                </div>
                                <footer>
                                    <button onClick={()=>window.location.href=`/course?id=${course.id}`}>Продолжить</button>
                                </footer>
                                </div>
                            </div>
                        ))}
                    </div>
            </section>
        </App>
    )
}