import { useState } from "react";
import "./Login.css";
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "このメールアドレスは既に使用されています";
    case "auth/invalid-email":
      return "無効なメールアドレスです";
    case "auth/weak-password":
      return "パスワードは8文字以上である必要があります";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "メールアドレスまたはパスワードが正しくありません";
    default:
      return `エラーが発生しました: ${error.message}`;
  }
};

const isPasswordValidForSignup = (password, birthDate) => {
  if (!PASSWORD_REGEX.test(password)) {
    alert("パスワードは8文字以上で、大文字、小文字、数字を含む必要があります");
    return false;
  }

  if (birthDate) {
    const yyyymmdd = birthDate.replace(/-/g, "");
    const mmdd = yyyymmdd.slice(4);

    if (password.includes(yyyymmdd) || password.includes(mmdd)) {
      alert("パスワードに生年月日を含めないでください");
      return false;
    }
  }

  return true;
};

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!isLoginMode && !isPasswordValidForSignup(password, birthDate)) {
      return;
    }

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        alert("ログインに成功しました");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: userName });
      alert("新規登録に成功しました");

      await setDoc(doc(db, "users", user.uid), {
        userName,
        birthDate,
        email,
        createAt: new Date(),
      });
    } catch (error) {
      console.error(error);
      alert(getAuthErrorMessage(error));
    }
  };

  const handleGoogleLogin = () => {
    alert("【デモ】 Googleログインの処理を実行");
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">My SNS App</h1>
        <h2 className="login-subtitle">{isLoginMode ? "ログイン" : "新規登録"}</h2>

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
              <div style={{ textAlign: "left" }}>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="login-input"
                  style={{ width: "100%", boxSizing: "border-box", marginTop: "4px" }}
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

          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="login-input"
              style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
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
            {isLoginMode ? "ログイン" : "新規登録してログイン"}
          </button>
        </form>

        <div className="login-divider">
          <span>または</span>
        </div>

        <button onClick={handleGoogleLogin} className="google-login-btn">
          <span className="google-icon">G</span>Googleでログイン
        </button>

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
