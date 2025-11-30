import './Header.css'
import AlertList from '../AlertList/AlertList'
import { useAlert } from '../AlertList/AlertContext';
import { useState, useEffect } from 'react';

export default function Header({headerText}){
      const { setIsAlertOpened } = useAlert();
  const [userName, setUserName] = useState('');

    useEffect(() => {
      const name = document.cookie.split('login=')[1]?.split(';')[0] || '';
      setUserName(name);
    }, []);
    return(
        <header className='mainHeader'>
          <h1>{headerText}</h1>
           <div style={{display:'flex', gap:'10px'}}>
            <button className="header-button" onClick={()=>setIsAlertOpened(true)}>
            <svg width="26" height="27" viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.0332 16.3688L19.9684 14.6011C19.7447 14.2071 19.5424 13.4617 19.5424 13.0251V10.3309C19.5424 7.82849 18.0729 5.66678 15.9538 4.65515C15.4 3.67546 14.3778 3.06848 13.2064 3.06848C12.0457 3.06848 11.0021 3.69676 10.4484 4.6871C8.37188 5.72003 6.9343 7.86043 6.9343 10.3309V13.0251C6.9343 13.4617 6.73197 14.2071 6.50835 14.5905L5.43282 16.3688C5.00687 17.0823 4.91103 17.8703 5.17725 18.5944C5.43282 19.3079 6.0398 19.8616 6.82781 20.1278C8.89367 20.8306 11.066 21.1714 13.2383 21.1714C15.4107 21.1714 17.583 20.8306 19.6489 20.1385C20.3943 19.8936 20.9693 19.3292 21.2462 18.5944C21.5231 17.8596 21.4485 17.0503 21.0332 16.3688Z" fill="#344977"/>
                <path d="M16.2304 21.5182C15.7832 22.7535 14.6012 23.6373 13.2168 23.6373C12.3756 23.6373 11.545 23.2966 10.9593 22.6896C10.6185 22.3701 10.363 21.9442 10.2139 21.5076C10.3523 21.5289 10.4907 21.5395 10.6398 21.5608C10.8847 21.5928 11.1403 21.6247 11.3959 21.646C12.0029 21.6992 12.6205 21.7312 13.2381 21.7312C13.8451 21.7312 14.4521 21.6992 15.0484 21.646C15.272 21.6247 15.4957 21.6141 15.7086 21.5821C15.879 21.5608 16.0494 21.5395 16.2304 21.5182Z" fill="#344977"/>
            </svg>
        </button>
          <span onClick={()=>window.location.href='/account'}>{(userName.slice(0,1))[0]}</span>
          </div>
        </header>
    )
}