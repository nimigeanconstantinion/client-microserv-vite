import React from 'react';
// import {useConfig} from "./config/useConfig";
import './App.css';
import {Provider} from "react-redux";
import store from "./store/store";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Homes from "./components/Home/index";
import 'bootstrap/dist/css/bootstrap.min.css';
import SpinComp from "../src/components/SpinComp/index"


function App() {
  return (
    <Provider store={store}>

        <div className="App">
            <header className="App-header">
                <BrowserRouter basename={"/ui"}>
                    <Routes>
                        <Route path={"/"} element={<Homes/>}/>
                        <Route path={"/test"} element={<SpinComp/>}/>
                    </Routes>
                </BrowserRouter>
            </header>
        </div>
    </Provider>

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
