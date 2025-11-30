import MainMenu from "./Elements/Menu/Menu.jsx"
import './App.css'
import AlertList from "./Elements/AlertList/AlertList.jsx"
import { useAlert } from "./Elements/AlertList/AlertContext.jsx";

export default function App({ children }){
  const { isAlertOpened, setIsAlertOpened } = useAlert();
  
  return(
    <main>
      <MainMenu />
      <AlertList isAlertOpened={isAlertOpened} setIsAlertOpened={setIsAlertOpened}/>
      <div className="basePage">
        {children}
      </div>
    </main>
  )
}