import './Header.css'

export default function Header({headerText}){
    const userName = 'Милашка'
    return(
        <header className='mainHeader'>
          <h1>{headerText}</h1>
          <span>{(userName.slice(0,1))[0]}</span>
        </header>
    )
}