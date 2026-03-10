import React, {useEffect, useState} from "react";
// import User from "../../models/User"
import Api from "../../Api";
import {selLoginRequest} from "../../store/authorization/auth.selector"
import {useDispatch, useSelector} from "react-redux";
import {loadAuthUser, loadToken, loginFail, loginRequest, loginSucces} from "../../store/authorization/auth.reducer"
import store from "../../store/store";
import AuthStatus from "../../models/statuses/AuthStatus";
import MessageBox from "../MessageBox";
import {WrapperRegister} from "./RegisterStyle";
import {keycloakServicex,AuthState} from "../auth/KeycloakServicex";
import RegisterUser from "../../models/RegisterUser";

interface LoginProp{
    // backFunction: Function
    backFunction: () => void;
}
const Register:React.FC<LoginProp>=({backFunction}) => {
    // const user:User={
    //
    //     email:"aaa@aaa",
    //     password:"aaa"
    // };


    let authSt:AuthStatus=useSelector(selLoginRequest)
    const [ch,setCh]=useState(0)
    //
    //  let authState = useSelector(selLoginRequest);
    // let tknState=useSelector(selRegisterUser);
    const dispatch = useDispatch();
    // let qMapStocList = useSelector(selLoginRequest);


    const [tkn,setTkn]=useState<string>("");
    const [usr,setUsr]=useState<RegisterUser>();
    const [eml,setEml]=useState<string>("");
    const [pass,setPass]=useState<string>("");
    const [username,setUserName]=useState<string>("");

    const [firstName,setFirstName]=useState<string>("");
    const [lastName,setLastName]=useState<string>("");

    const [msgTrigger,SetMsgTrigger]=useState(0);
    const [showMsg, SetShowMsg] = useState(false);
    const [typeMsg,SetTypeMsg]=useState("alert-warning");
    const [msg,SetMsg]=useState("");
    const [msgTitle,SetMsgTitle]=useState("");

    const [loading, setLoading] = useState(true);
    const [authState, setAuthState] = useState<AuthState | null>(null);


    useEffect(()=>{
        console.log("In Register");
        keycloakServicex.init().then(state => {
            setAuthState(state);
            setLoading(false);
        });
        // setUsr({email:"aaa@aaa",password:"aaa"})
        // dispatch(loginTest);

    },[])

    useEffect(()=>{
        console.log("In change");
        console.log(store.getState().loginAuthState.loadStatus)
    },[ch])

    // let register=async ()=>{
    //     console.log("In register "+ch)
    //     dispatch(loginRequest());
    //
    //     let api=new Api();
    //     if(usr!=undefined&&usr.email!==""&&usr.password!=""){
    //
    //
    //         try{
    //
    //
    //
    //             let response=await api.register(usr);
    //
    //             console.log("am iesit");
    //             let authUser:RegisterUser=usr;
    //
    //             // console.log(authUser);
    //             setTkn(response);
    //             dispatch(loadToken(response))
    //             dispatch(loadAuthUser(authUser))
    //             dispatch(loginSucces())
    //             SetMsgTrigger(1);
    //             SetTypeMsg("alert-success");
    //             SetMsg("Welcome "+authUser.name+" !!");
    //             SetMsgTitle("Succes!")
    //             SetShowMsg(true);
    //             setTimeout(()=>{
    //                 SetShowMsg(false);
    //             },1100)
    //         }catch (e) {
    //             console.log("Eroare la login");
    //             SetMsgTrigger(1);
    //             dispatch(loginFail())
    //         }
    //
    //     }else{
    //         SetMsgTrigger(1);
    //         SetTypeMsg("alert-warning");
    //         SetMsg("Login Fail! Retry!");
    //         SetMsgTitle("WARNING !!!")
    //         SetShowMsg(true);
    //         setTimeout(()=>{
    //             SetShowMsg(false);
    //         },1100)
    //     }
    //
    // }

    let sclk=async ()=>{
        console.log("In clk");
        // await register();

        setCh(prevState => ++prevState);
        backFunction();

    }

    let handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
        let what=e.target.id
        console.log("============================"+e.target.id);
        let chUser:RegisterUser={
            username:username,
            firstName:firstName,
            lastName:lastName,
            email:eml,
            password:pass,

        };
        if(what.includes("Eml")){
            setEml(prevState => e.target.value);
            chUser.email=e.target.value;
        }
        if(what.includes("Pass")){
            setPass(prevState => e.target.value);
            chUser.password=e.target.value;
        }
        if(what.includes("inputFirst")){
            setFirstName(prevState => e.target.value);
            chUser.firstName=e.target.value;

        }
        if(what.includes("inputLast")){
            setLastName(prevState => e.target.value);
            chUser.lastName=e.target.value;

        }
        if(what.includes("inputName")) {
            setUserName(prevState => e.target.value)
            chUser.username=e.target.value;
        }

        setUsr(chUser);
        console.log(chUser);

    }


    const handleRegister = async (e:React.FormEvent) => {
        e.preventDefault();
        //
        // let userName=document.getElementById("inputName")?.innerText?document.getElementById("inputName")!.innerText:'';
        // let userEmail=document.getElementById("inputEml")?.innerText?document.getElementById("inputEml")!.innerText:'';
        //
        // keycloakServicex.registerWithRedirect(userName,userEmail);
        let api=new Api();
        if(usr){
            try{
                let response=await api.registerUser(usr);

                if(response.includes("OK REGI")){
                        SetMsgTrigger(1);
                        SetTypeMsg("alert-success");
                        SetMsg("Successfully register "+usr.firstName+" "+usr.lastName+"! Try Login NOW!");
                        SetMsgTitle("Succes!")
                        SetShowMsg(true);
                        setTimeout(()=>{
                            SetShowMsg(false);
                            backFunction();
                        },1200)                }

            }catch (e){
                SetMsgTrigger(1);
                SetTypeMsg("alert-warning");
                SetMsg("Login Fail! Please Retry!");
                SetMsgTitle("Warning!")
                SetShowMsg(true);
                setTimeout(()=>{
                    SetShowMsg(false);
                    backFunction();
                },1200)

            }
            // let response=await api.registerUser(usr)
            // console.log(response);
            // if(response){
            //     SetMsgTrigger(1);
            //     SetTypeMsg("alert-success");
            //     SetMsg("Welcome "+usr.firstName+" "+usr.lastName+" !!");
            //     SetMsgTitle("Succes!")
            //     SetShowMsg(true);
            //     setTimeout(()=>{
            //         SetShowMsg(false);
            //         backFunction();
            //     },1200)
            // }else{
            //     SetMsgTrigger(1);
            //     SetTypeMsg("alert-warning");
            //     SetMsg("Login Fail! Please Retry!");
            //     SetMsgTitle("Warning!")
            //     SetShowMsg(true);
            //     setTimeout(()=>{
            //         SetShowMsg(false);
            //         backFunction();
            //     },1200)
            //
            // }
            // setTimeout(()=>{
            //     backFunction();
            // },1300)
        }

    };

    // let registerKeycloak=async (e: React.FormEvent)=>{
    //     e.preventDefault();
    //
    //     let chUser:RegisterUser={
    //         username:username,
    //         firtsName:firstName,
    //         lastName:lastName,
    //         email:eml,
    //         password:pass,
    //     };
    //     try {
    //
    //
    //     }catch (e){
    //         return Promise.reject(e);
    //     }
    // }

    let registerClk=async ()=> {
        try {
            // await register();
            backFunction();
            // let elmColl=document.getElementsByClassName("divlogin");
            // let elmContainer=elmColl[0] as HTMLElement;
            //
            // setTimeout(()=>{
            //     elmContainer.style.display="none";
            //
            // },6100)

        } catch (e) {

        }
    }

    return(
        <WrapperRegister>
            <div className={"divlogin"}>

                {/*<div className={`alert alert-dismissible ${typeMsg} fade-in-out ${isVisible ? 'visible' : ''}`}>*/}
                {/*    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>*/}
                {/*    <h4 className="alert-heading">{msgTitle}</h4>*/}
                {/*    <p className="mb-0">{msg}</p>*/}
                {/*</div>*/}
                {
                    showMsg?(
                        <>
                            <MessageBox type={typeMsg} title={msgTitle} message={msg} isVisible={showMsg}/>

                        </>
                    ):""
                }

                <form>

                    <fieldset>

                        <div className="form-group">
                            <label htmlFor="inputName" className="form-label mt-4">User Name</label>
                            <input type="text" className={"form-control"} id="inputName"
                                   placeholder="Enter User Name" value={username} onInput={handleChange}/>
                        </div>

                        <div className="form-group">
                            <label htmlFor="inputFirstName" className="form-label mt-4">First Name</label>
                            <input type="text" className={"form-control"} id="inputFirstName"
                                   placeholder="Enter First Name" value={firstName} onInput={handleChange}/>
                        </div>

                        <div className="form-group">
                            <label htmlFor="inputLastName" className="form-label mt-4">Last Name</label>
                            <input type="text" className={"form-control"} id="inputLastName"
                                   placeholder="Enter Last Name" value={lastName} onInput={handleChange}/>
                        </div>


                        <div className="form-group">
                            <label htmlFor="email" className="form-label mt-4">Email address</label>
                            <input type="email" className={"form-control"} id="inputEml"
                                   placeholder="Enter Email" value={eml} onInput={handleChange}/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="exampleInputPassword1" className="form-label mt-4">Password</label>
                            <input type="password" className="form-control" id="inputPass"
                                   placeholder="Password" autoComplete="off" value={pass} onChange={handleChange}/>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={handleRegister}>Register</button>
                        <button type="button" className="btn btn-info" onClick={sclk}>Go back</button>

                    </fieldset>


                </form>
            </div>


            {/*</div>*/}
        </WrapperRegister>
    );
}

export default Register;