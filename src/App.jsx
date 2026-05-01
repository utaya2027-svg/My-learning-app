import { useEffect, useState } from 'react'
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth'; //ログイン状態を確認
import Login from './Login';
import SnsApp from './SnsApp/SnsApp'; 



function App() {

  const [user, setUser] = useState(null); // ログインユーザーの状態を管理

  const[loging, setLoging] = useState(true); // ログイン状態の確認中かどうかを管理

  console.log("Appの状態チェック:", loging ? "ロード中" : "完了", user ? "ログイン済み" : "未ログイン");

  useEffect(() => {
    // Firebase AuthenticationのonAuthStateChangedを使ってログイン状態を監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // ログインユーザーの情報を状態にセット
      setLoging(false); // ログイン状態の確認が完了したことを示す
    });

    // クリーンアップ関数を返す
    return () => unsubscribe();
  }, []);

  if (loging) {
    return(
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {user ? <SnsApp /> : <Login />} {/* ログインしているユーザーがいればSnsAppを表示、いなければLoginを表示 */}
    </>
  );
}

export default App;

