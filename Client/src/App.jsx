import MainMenu from "./Elements/Menu/Menu.jsx"
import './App.css'
//ПОПРОБОВАТЬ ЗАМЕНИТЬ HEADER И ВСТАВИТЬ ЕГО СЮДА С ПРОПСАМИ
// ГОВНО ЕБАНОЕ, ДЕЛАЕМ ВСТАВЛЯЕМЫЙ ХЭДЕР В КАЖДУЮ СТРАНИЦУ
export default function App({ children, headerText }){
  const userName = 'Милашка'
  return(
    <main >
    <MainMenu/>
    <main className="basePage">

      {children}
    </main>
    </main>
  )
}