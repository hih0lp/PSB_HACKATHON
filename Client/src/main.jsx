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

const router = createBrowserRouter([
    {
        path: '', //Тут будет список проектов
        element: (
           <App></App>
        ),
    },
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
    }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
