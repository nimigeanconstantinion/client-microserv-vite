import React, {useEffect, useState} from 'react';
// import {useConfig} from "./config/useConfig";
import './App.css';
import {Provider} from "react-redux";
import store from "./store/store";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Homes from "./components/Home/index";
import 'bootstrap/dist/css/bootstrap.min.css';
import SpinComp from "../src/components/SpinComp/index"
import {AuthState, myKeycloakService} from "./components/auth/MyKeycloakService";


interface HomeProps{
    auth:AuthState;
}

function App() {

    const [auth, setAuth] = useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
    });

    useEffect(() => {
        myKeycloakService.init().then((auth) => {
            setAuth(auth);
            const urlParams = new URLSearchParams(window.location.search);
            const action = urlParams.get('doAction');

            // Dacă ne-am întors din logout și încă nu suntem logați, pornim Register automat
            if (action === 'register' && !auth.isAuthenticated) {
                // Ștergem parametrul din URL ca să nu intre în buclă la refresh
                window.history.replaceState({}, document.title, window.location.pathname);
                myKeycloakService.register();
            }
        });
    }, []);

    if (auth.isLoading) return <p></p>;

    // Rămânem mereu în LoginForm, dar îi dăm starea
  return (
      <div className="App">

              <Provider store={store}>

                <div className="App">
                    <header className="App-header">
                        <BrowserRouter basename={"/ui"}>
                            <Routes>
                                <Route path={"/"} element={<Homes auth={auth} />} />
                                {/*<Route path={"/"} element={<Homes  />}/>*/}
                                <Route path={"/test"} element={<SpinComp/>}/>
                            </Routes>
                        </BrowserRouter>
                    </header>
                </div>
              </Provider>
      </div>
  );
  //   const apiUrll = process.env.NODE_ENV || 'Default';
  //   const [urll,setUrll]=useState("default");
  //
  //   useEffect(()=>{
  //      setUrll(process.env.NODE_ENV);
  //      load()
  //   },[])
  //
  //   let load=async ()=>{
  //      setUrll(process.env.NODE_ENV);
  //   }
  //
  //   return (
  //       <div className="App">
  //           <header className="App-header">
  //               {
  //                 urll?(
  //                     <>
  //
  //                         <p>Conținutul variabilei de mediu apiUrll:</p>
  //                         <p>{urll} {globalConfig!.apiUrl}</p>
  //                         <p>
  //                             {apiUrll}
  //                         </p>
  //                     </>
  //                 ):""
  //               }
  //
  //           </header>
  //       </div>
  //   );
}

export default App;
