import React, { useState } from 'react';
// import { KeycloakService } from './KeycloakService';
import {KeycloakServices} from "./KeycloakServices";
import {WrapperKclLogin} from "./indexStyle";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authKeycloak/authKeycloakSlice';
import store from "../../store/store"; // ajustează calea după setup
import MessageBox from "../MessageBox";

import Spinner from '../NewSpin/index';

import spinnerGif from "../assets/spinner.gif";
import { keycloakServices } from "./KeycloakServices";
import { keycloakServicex } from "./KeycloakServicex";

import {loadAuthUser, loadToken, loginSucces} from "../../store/authorization/auth.reducer";
import User from "../../models/User"; // calea către GIF-ul tău

interface CustomLoginProps {
    onCancel: () => void;
}

const CustomLogin: React.FC<CustomLoginProps> = ({ onCancel }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [msgTrigger,SetMsgTrigger]=useState(0);
    const [showMsg, SetShowMsg] = useState(false);
    const [typeMsg,SetTypeMsg]=useState("alert-warning");
    const [msg,SetMsg]=useState("");
    const [msgTitle,SetMsgTitle]=useState("");


    const dispatch = useDispatch();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // let token = await KeycloakServices.loginDirect(username, password);
            console.log("INNNNNNNNN")
            //  const auth=await ksrv.loginDirect(username,password);
            const auth=await keycloakServicex.loginDirect(username,password);
            console.log("After-----------------------------")
            console.log(auth);
            const token=auth.token;
            // console.log("Dupa await token");
            console.log(token);
            if (token) {

                    console.log('Login successful', token);

                    // const userInfo = await KeycloakService.keycloak?.loadUserInfo();
                    // console.log('👤 User Info:', userInfo);
                console.log("------------------------------------------")
                try {
                    const payloadBase64 = token.split('.')[1];
                    const decoded = JSON.parse(atob(payloadBase64));
                    dispatch(loginSuccess({ token, user: decoded }));

                    console.log('👤 Decoded token payload:', decoded);
                    console.log('👤 Username:', decoded.preferred_username);
                    console.log('📧 Email:', decoded.email);
                    console.log('🏰 Realm roles:', decoded.realm_access?.roles);
                    console.log("============================");
                    const userName=store.getState().auth.user!.given_name+" "+store.getState().auth.user!.family_name;
                    let authUser:User={
                        name: userName,
                        password: '',
                        email: (store.getState().auth.user!.email ?? "") as string,
                        token: store.getState().auth.token,
                        role: "USER"

                    }

                    // setTkn(response.token!);
                    dispatch(loadToken(authUser.token!))
                    dispatch(loadAuthUser(authUser))
                    dispatch(loginSucces())

                    SetMsgTrigger(1);
                    SetTypeMsg("alert-success");
                    SetMsg("Welcome "+userName+" !!");
                    SetMsgTitle("Succes!")
                    SetShowMsg(true);
                    setTimeout(()=>{
                        SetShowMsg(false);
                    },1200)
                } catch (e) {
                    console.error('Failed to decode token:', e);
                }

                    setTimeout(() => {
                        // setUsername('');
                        // setPassword('');
                        onCancel();
                    }, 1500);

                // aici poți redirecționa sau ascunde formularul după succes
            } else {
                // mesaj de eroare vizibil
                // setError('Login failed. Returning to main window...');

                SetMsgTrigger(1);
                SetTypeMsg("alert-warning");
                SetMsg("Login Fail! Please Retry!");
                SetMsgTitle("Warning!")
                SetShowMsg(true);
                setTimeout(()=>{
                    SetShowMsg(false);
                },1200)


                // după 2 secunde, resetăm și revenim la container
                setTimeout(() => {
                    setError('');
                    setUsername('');
                    setPassword('');
                    onCancel(); // dezactivează componenta
                }, 2000);
            }
        } catch (err) {
            console.error('Login error:', err);
            // setError('Login failed due to server error. Returning...');



            setTimeout(() => {
                setError('');
                setUsername('');
                setPassword('');
                onCancel();
            }, 2000);
        }
    };

    return (
        <WrapperKclLogin>
            {/*<Spinner  size={70} className={"spinn"}/>*/}

            {
                msgTrigger>=0?(
                    <>
                        <MessageBox type={typeMsg} title={msgTitle} message={msg} isVisible={showMsg}/>

                    </>
                ):""
            }
            <div className={"kcl-login"}>

                <h2 className="mb-4">Custom Keycloak Login</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-2">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="p-2 border rounded"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-2 border rounded"
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
                {error && <p className="text-red-600 mt-2">{error}</p>}
            </div>

        </WrapperKclLogin>

    );
};

export default CustomLogin;
