import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
    createBrowserRouter,
    RouterProvider,
    Route,
    Link,
} from 'react-router-dom';
import Cabinet from './Pages/Cabinet/Cabinet.jsx';
import Lesson from './Pages/Lesson/Lesson.jsx';
import LessonForm from './Pages/Lesson/LessonForm.jsx';
import LoginPage from './Elements/RegLogPages/LoginPage.jsx';
import RegisterPage from './Elements/RegLogPages/RegisterPage.jsx';
import AdminPanel from './Pages/AdminPage/Admin.jsx';
import CreatedLessonList from './Pages/LessonsList/CreatedLessonList.jsx';
import NonTutorLessonList from './Pages/LessonsList/NotTutorLessonLict.jsx';
import AllLessonList from './Pages/LessonsList/AllLessons.jsx';
import { AlertProvider } from './Elements/AlertList/AlertContext.jsx';
import HomeworkCheck from './Pages/homework/Homework.jsx';

const router = createBrowserRouter([
    // {
    //     path: '', //Тут будет список проектов
    //     element: (
    //        <App></App>
    //     ),
    // },
    {
      path:'account',
      element: (
        <Cabinet/>
      )
    },
    {
      path:'course',
      element:(
        <Lesson></Lesson>
      )
    },
    {
      path:'createcourse',
      element:(
        <LessonForm></LessonForm>
      )
    },
    {
      path:'',
      element: <LoginPage/>
    },
    {
      path:'register',
      element: <RegisterPage/>
    },
    {
      path:'account/admin',
      element: <AdminPanel/>
    },
    {
      path:'createdLessons',
      element: <CreatedLessonList/>
    },
    {
      path:'Lessons',
      element: <AllLessonList/>
    },
    {
      path:'studentLessons',
      element: <NonTutorLessonList/>
    },
    {
      path:'homeworkcheck',
      element: <HomeworkCheck/>
    }

])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlertProvider>
    <RouterProvider router={router} />
    </AlertProvider>
  </StrictMode>,
)
