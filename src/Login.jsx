import { useState } from "react";
import "./Login.css"; // ログイン画面のスタイルを定義するCSSファイルをインポート
import { auth , db } from './firebase'; // Firebase Authenticationのインスタンスをインポート
import { createUserWithEmailAndPassword, signInWithEmailAndPassword,updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";


export default function Login() {
    //ログイン画面か新規登録画面かを切り替えるスイッチ
    const [isLoginMode, setIsLoginMode] = useState(true);

    //入力されたメールアドレスとパスワードを管理する状態
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userName, setUserName] = useState(""); // 新規登録時のユーザー名を管理する状態
    const [birthDate, setBirthDate] = useState(""); // 新規登録時の生年月日を管理する状態
    const [showPassword, setShowPassword] = useState(false);//パスワードの表示切り替え

    //メアドでログイン(または新規登録)する関数
    const handleEmailSubmit = async (e) => {
        e.preventDefault(); // フォームのデフォルトの送信動作を防止

        //新規登録時の
        //パスワードチェック項目
        if (!isLoginMode) {
                //パスワードチェック１(大文字小文字、数字を含む8文字以上か)
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
                if (!passwordRegex.test(password)) {
                    alert("パスワードは8文字以上で、大文字、小文字、数字を含む必要があります");
                    return;
                }
            

                //パスワードチェック２(生年月日を含まないか)
                //birthData は　YYYY-MM-DDの形式のため、数字だけを抜き取る
                if (birthDate) {
                    const yyyymmdd = birthDate.replace(/-/g, ""); // 例: "1990-01-01" → "19900101"
                    const mmdd = yyyymmdd.slice(4); // 例: "19900101" → "0101"
                    if (password.includes(yyyymmdd) || password.includes(mmdd)) {
                        alert("パスワードに生年月日を含めないでください");
                        return;
                    }

                }
        }


        try {
            if (isLoginMode) {
                // ログイン処理
                await signInWithEmailAndPassword(auth, email, password);
                alert("ログインに成功しました");
            } else {
                // 新規登録処理
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // ユーザー名を更新
                await updateProfile(user, { displayName: userName });
                alert("新規登録に成功しました");

                //dbの使用
                await setDoc(doc(db, "users", userCredential.user.uid),{
                    userName : userName,
                    birthDate : birthDate,
                    email : email,
                    createAt : new Date()
                });
            }
        } catch (error) {
            console.error(error)
            if (error.code === "auth/email-already-in-use") {
                alert("このメールアドレスは既に使用されています");
            } else if (error.code === "auth/invalid-email") {
                alert("無効なメールアドレスです");
            } else if (error.code === "auth/weak-password") {
                alert("パスワードは8文字以上である必要があります");
            } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                alert("メールアドレスまたはパスワードが正しくありません");
            } else {
                alert("エラーが発生しました: " + error.message);
            }
        }
    };

    // Googleでログインする関数
    const handleGoogleLogin = () => {
        alert("【デモ】 Googleログインの処理を実行");
        // ここにFirebase Authenticationを使ったGoogleログインの処理を実装する予定
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">My SNS App</h1>
                <h2 className="login-subtitle">{isLoginMode ? "ログイン" : "新規登録"}</h2>

                {/* メールアドレスとパスワードの入力フォーム */}
                <form onSubmit={handleEmailSubmit} className="login-form">
                    {!isLoginMode && (
                        <>
                        <input
                            type="text"
                            placeholder="ユーザー名"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                            className="login-input"
                        />
                         {/* 新規登録モードのときのみ表示する生年月日入力フィールド */}
                        <div style={{ textAlign: "left" }}>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                required
                                className="login-input"
                                style={{width: "100%", boxSizing: "border-box", marginTop: "4px"}}
                            />
                        </div>
                        </>

                    )}


                    <input
                        type="email"
                        placeholder="メールアドレス"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="login-input"
                    />
                    
                    <div style={{position : "relative" , width : "100%"}}>
                        <input type={
                            showPassword ? "text" : "password"}
                            placeholder={isLoginMode ? "パスワード" : "パスワード"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="login-input"
                            style={{width : "100%", paddingRight : "40px", boxSizing : "border-box"}}>
                        </input>

                        <span onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position : "absolute",
                                right : "10px",
                                top : "50%",
                                transform : "translateY(-50%)",
                                cursor : "pointer",
                                userSelect : "none",
                                display : "flex",
                                alignItems : "center",
                            }}>
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            )}
                        </span>
                    </div>

                    <button type="submit" className="login-submit-btn" style={{ backgroundColor: isLoginMode ? "#000000" : "#1a73e8" }}>
                        {isLoginMode ? "ログイン" : "新規登録してログイン"}</button>
                </form>
            {/* 区切り線 */}
            <div className="login-divider">
                <span>または</span>
            </div>

            {/* Googleログインボタン */}
            <button onClick={handleGoogleLogin} className="google-login-btn">
                <span className="google-icon">G</span>Googleでログイン
            </button>

            {/* ログインと新規登録の切り替えリンク */}
            <p className="login-toggle-text">
                {isLoginMode ? "アカウントをお持ちでない方はこちらから" : "既にアカウントをお持ちの方はこちらから"}
                <span onClick={() => setIsLoginMode(!isLoginMode)} className="login-toggle-link">
                    {isLoginMode ? "新規登録" : "ログイン"}
                </span>
            </p>
       </div>
        </div>
    );
    }

