import { useState , useEffect } from 'react'; // ReactのuseState機能を呼び出す
import './SnsApp.css'; 
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection ,  addDoc , serverTimestamp , onSnapshot , query , orderBy, doc,updateDoc,arrayUnion,arrayRemove} from 'firebase/firestore';


export default function SnsApp() {

    const [postText , setPostText] = useState(""); //入力中のテキスト
    const [posts , setPosts] = useState([]); //取得した投稿のリスト

    const [activeCommnetPostId,setActiveCommnetPostId] = useState(null); //どの投稿のコメント欄を開いているか
    const [commentText,setCommnetText] = useState(""); //入力中のコメント


    //投稿時の処理
    const handlePostSubmit = async (e) => {

        console.log("🟢 投稿ボタンがクリックされました！入力内容:", postText);
        
        if(e) e.preventDefault(); //フォーム送信画面のリロードを防ぐ
        if (!postText.trim()) 

            console.log("🔴 テキストが空っぽなので処理を止めます");

            return;
        
        try {

            console.log("🟡 Firebaseに保存を開始します...");

            await addDoc(collection(db , "posts"), {
                text : postText,
                userName : auth.currentUser?.displayName || "名無しさん" , //ログイン中のユーザ名
                authorId : auth.currentUser?.uid || "",//投稿者のUID
                likes : 0,
                comments : 0,
                createdAt : serverTimestamp(), //投稿時間
                tags : ["#日常"]
            });

            console.log("🔵 保存成功！画面を切り替えます");

            //投稿したら入力を空にしてホームへ戻る
            setPostText(""); 
            setCurrentTab("home");
            
        } catch (error){
            console.error("投稿エラー",error);
            alert("投稿に失敗しました");
        }

    }

        //いいねを推した時の処理
        const handleLikeToggle = async(post) => {
            const postRef = doc(db,"posts",post.id);
            const currentUserId = auth.currentUser.uid;
            //自分がいいねをしているかのチェック
            const isLiked = post.likedUsers && post.likedUsers.includes(currentUserId);

            try {
                if(isLiked){
                    //いいね解除
                    await updateDoc(postRef,{likedUsers: arrayRemove(currentUserId)});
                } else {
                    //いいね追加
                    await updateDoc(postRef,{likedUsers: arrayUnion(currentUserId)});
                }
            } catch(error) {
                console.error("いいねエラー",error)
            }
        };

        //コメント送信時の処理
        const handleCommnetSubmit = async(postId) => {
            if(!commentText.trim()) return;
            const postRef = doc(db,"posts",postId);

             try{
                await updateDoc(postRef,{
                    //commnetList配列に新しいコメントを追加
                    commentList : arrayUnion({
                    userName : auth.currentUser?.displayName || "名無しさん",
                    text :  commentText,
                    createdAt : new Date().toISOString() //簡易的に時間をテキストで保存
                    })            
                });
                setCommnetText(""); //送信したら入力欄を空に
            } catch (error) {
                console.error("コメントエラー",eroor);
            }
        };

    //DBから投稿をリアルタイムで取得する
    useEffect(() => {
        //"posts"コレクションを"createdAt"(作成日時)の"desc"(新しい順)で並び替える
        const q = query(collection(db,"posts") , orderBy("createdAt","desc"));

        //onSnapShotで、DB内の変更時に自動更新をする
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postDate = snapshot.docs.map( (doc) => ({
                id : doc.id,
                ...doc.data()
            }));
            setPosts(postDate);
        });

        return () => unsubscribe();
    }, []);


    const handleLogout = async () => {
        try {
            await signOut(auth); //Firebaseにてログアウトを宣言
        } catch (error) {
            console.error("ログアウトエラー",error);
            alert("ログアウトに失敗しました");
        }
    }


    //ユーザーが設定した任意のタグリスト(将来的にデータベースから取得)

    
    //　今は仮のタグリストを用意
    const[savedTags, setSavedTags] = useState(['#旅行', '#グルメ', '#ファッション']);

    //「今選ばれているタグを覚えておく箱」(初期値は「すべて」)
    const [activeTag, setActiveTag] = useState('すべて');

    //今どのタブが選ばれているかを管理する状態(activeTag)を用意して、初期値は「すべて」に設定
    const [currentTab, setCurrentTab] = useState('home'); 

    // リフレッシュ処理の追加
    const [isRefreshing, setIsRefreshing] = useState(false);// リフレッシュ中かどうかの状態を管理
    const [pullY, setPullY] = useState(0); // ドラッグの距離を管理
    const [startY, setStartY] = useState(null); // ドラッグ開始位置を管理

    //settings画面のいいね表示設定の状態管理
    const [hiddenLikes, setHiddenLikes] = useState(false); // いいね表示のオンオフを管理する状態
    const [isDarkMode, setIsDarkMode] = useState(false); // ダークモードのオンオフを管理する状態

    // 指が画面に触れた時の処理
    const handleTouchStart = (e) => {
        //スクロールが一番上の状態で、さらに引っ張ろうとしたときのみリフレッシュ処理を開始
        if(e.currentTarget.scrollTop === 0){
            setStartY(e.touches[0].clientY); // ドラッグ開始位置を保存
        }
    };

    //指を動かしている時の処理
    const handleTouchMove = (e) => {
        if (startY === 0) return; // ドラッグ開始位置が保存されていない場合は処理しない
        const currentY = e.touches[0].clientY;
        const diffY = currentY - startY;// どれだけ引っ張ったかを計算
        if (diffY > 0 && e.currentTarget.scrollTop === 0) { // 下方向に引っ張っていて、かつスクロールが一番上の場合のみ処理
            setPullY(diffY < 80 ? diffY : 80); // 引っ張った距離を更新（最大80pxまで）
        }
    };


    // 指を離したときの処理
    const handleTouchEnd = () => {
        if (pullY > 50) {
            // 50px以上引っ張った場合はリフレッシュ処理を開始
            setIsRefreshing(true);
            setPullY(50); // リフレッシュ状態を示すために引っ張った距離を固定

            //擬似的な通信処理（実際にはここでAPIを呼び出して新しい投稿データを取得する）
            setTimeout(() => {
                const shuffledPosts = [...posts].sort(() => Math.random() - 0.5); // 投稿データをランダムに並び替える
                setPosts(shuffledPosts); // 並び替えた投稿データを状態に反映
                setIsRefreshing(false); // リフレッシュ処理終了
                setPullY(0); // ドラッグの距離をリセット
            },1500); // 1.5秒後にリフレッシュ処理を終了
        } else {
            // 50px未満の場合はリフレッシュ処理をキャンセル
            setPullY(0);
        }
        setStartY(0); // ドラッグ開始位置をリセット
    };



    // activeTagの状態に合わせて表示する投稿をフィルタリング
    const filteredPosts = posts.filter((post) => {
        if (activeTag === 'すべて') return true; // すべての投稿を表示
        return post.tags.includes(activeTag); // 選択されたタグを含む投稿のみ表示
    });
       
    // 検索画面用のダミーカテゴリ
    const searchcategories = ['カメラ', '旅行', 'グルメ', 'ファッション', 'スポーツ', '音楽', '映画', 'アート', 'テクノロジー', 'ペット'];

    return (
        <div className={`sns-container ${isDarkMode ? 'dark-mode' : ''}`}>




            {/* ホーム画面(currentTabがhomeのときに表示) */}




            { currentTab === 'home' && (
                <>
                    <header className="sns-header">
                        <div className="tag-list">
                            <button className={`tag-button ${activeTag === 'すべて' ? 'active' : ''}`} onClick={() => setActiveTag('すべて')}>すべて</button>
                            {savedTags.map((tag, index) => (
                                <button key={index} className={`tag-button ${activeTag === tag ? 'active' : ''}`} onClick={() => setActiveTag(tag)}>{tag}</button>
                            ))}
                        </div>
                    </header>

                    <main className="sns-main-content" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                        <div className="refresh-indicator" style={{height: `${isRefreshing ? 50 : pullY}px`,transition: isRefreshing ? "height 0.3s ease" : 'none'}}>
                            {isRefreshing ? "↻ 更新中..." : pullY > 50 ? "↑ 話して更新" : "↓ 引っ張って更新"}
                        </div>

                        {filteredPosts.map((post) => (
                            <div key={post.id} className="post-card">
                                <div className="post-header">
                                    <div className="user-icon"></div>
                                    <span className="user-name">{post.userName || post.author || "名無しさん"}</span>
                                </div>
                                <div className="post-image-placeholder"></div>
                                <div className="post-text" style={{ padding: "10px 15px 5px", fontSize: "15px" }}>
                                    <span className="user-name" style={{ marginRight: "8px" }}>{post.userName || post.author || "名無しさん"}</span> {post.text}</div>
                                <div className="post-action" style={{ padding: "5px 15px", borderBottom: "none" }}>
                                    <span className="action-item" onClick={() => handleLikeToggle(post)} style={{cursor: "pointer", color : (post.likedUsers && post.likedUsers.includes(auth.currentUser?.uid)) ? "red" : "white"}}>
                                        {(post.likedUsers && post.likedUsers.includes(auth.currentUser?.uid)) ? "❤️" : "🤍"}
                                        {hiddenLikes ? "" : (post.likedUsers?.length || 0)}
                                    </span>
                                    <span className="action-item" onClick={() => setActiveCommnetPostId(post.id)} style={{cursor : "pointer"}}>💬 {post.commentList?.length || 0}</span>
                                </div>
                                {post.dummyCommnet && (
                                    <div className='post-single-commnet' style={{padding : "0 15px 10px", fontSize : "13px", color : "#333333"}}>
                                        <span style={{ fontWeight : "bold", marginRight : "6px"}}>{post.dummyCommnet.user}</span>
                                        {post.dummyCommnet.text}
                                    </div>
                                )}
                                
                                <div className="post-tags" style={{padding : "0 15px 15px"}}>
                                    {post.tags && post.tags.map((tag, index) => (
                                        <span key={index} className="post-tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </main>
                </>
            )}


    {/* 検索画面(currentTabがsearchのときに表示) */}

            {currentTab === 'search' && (
                <main className="sns-main-content sns-search-content">

                    {/* 検索バー */}
                    <div className="search-bar-container">
                        <div className="search-input-dummy">🔍 検索</div>
                    </div>

                    {/* 横スクロールのカテゴリリスト */}
                    {searchcategories.map((category, index) => (
                        <div key={index} className="search-category-section">
                            <h3 className="category-title">{category}</h3>
                            <div className="horizontal-scroll-list">
                                {/* ダミーの四角い箱を四つ並べる*/}
                                <div className="category-search-image"></div>
                                <div className="category-search-image"></div>
                                <div className="category-search-image"></div>
                                <div className="category-search-image"></div>
                            </div>
                        </div>
                    ))}
                </main>
            )}

    {/* 投稿画面(currentTabがcreateのときに表示) */}

            {currentTab === 'create' && (
                <main className="sns-main-content sns-create-content">
                    <div className="create-header">
                        <span className="create-cancel" onClick={() => setCurrentTab("home")}>キャンセル</span>
                        <h2 className="create-title">新規投稿</h2>
                        {/* ここでは投稿完了の処理は実装せず、完了ボタンを押すとホーム画面に戻るだけの動作にする */}
                        <span className="create-post-btn" onClick={handlePostSubmit} style={{cursor : "pointer", color : "#1a73e8", fontWeight : "bold"}}>投稿</span>
                    </div>

                    <textarea className="create-textarea" placeholder="今の気持ちをシェアしよう..." rows="6" value={postText} onChange={(e) => setPostText(e.target.value)}></textarea>

                    <div className="create-image-add">
                        <span className="add-icon">📷</span>
                        <span>画像を追加</span>
                    </div>
                </main>
            )}

    {/* 受信箱画面(currentTabがinboxのときに表示) */}

            {currentTab === 'inbox' && (
                <main className="sns-main-content sns-inbox-content">
                    <h2 className="inbox-title">受信箱</h2>
                    <p className="inbox-placeholder">新しいメッセージはありません</p>
                </main>
            )}

    {/* 設定＆プロフィール画面(currentTabがsettingsのときに表示) */}

            {currentTab === 'settings' && (
                <main className="sns-main-content sns-settings-content">

                    <h2 className="settings-page-title">設定とプライバシー</h2>

                    {/* プロフィール編集エリア */}
                    <div className="settings-profile-section">
                        <div className="settings-user-icon"></div>
                        <div className="settings-user-info">
                            <h3 className="settings-user-name">{auth.currentUser?.displayName || "ユーザー"}</h3>
                            <p>@{auth.currentUser?.uid.slice(0,8)}</p>
                        </div>

                        <button className="edit-profile-button" onClick={() => alert("【デモ版】プロフィール編集画面へ遷移します")}>編集</button>
                    </div>

                    {/* 設定項目エリア (グループ1　アプリ設定)*/}
                    <div className="settings-group">
                        <h4 className="settings-group-title">アプリの設定</h4>

                        {/*　いいね表示設定 */}
                        <div className="settings-list-item">
                            <div className="item-left">
                                <span className="item-icon">👁️</span>
                                <span>いいねを非表示</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={hiddenLikes}
                                    onChange={() => setHiddenLikes(!hiddenLikes)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="settings-list-item">
                            <div className="item-left">
                                <span className="item-icon">🔔</span>
                                <span>通知設定</span>
                            </div>
                            <span className="item-arrow">＞</span>
                        </div>

                        <div className="settings-list-item">
                            <div className="item-left">
                                <span className="item-icon">🌙</span>
                                <span>ダークモード</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={isDarkMode}
                                    onChange={() => setIsDarkMode(!isDarkMode)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* 設定項目エリア (グループ2　その他)*/}
                    <div className="settings-group">
                        <h4 className="settings-group-title">アカウント</h4>

                        <div className="settings-list-item" onClick={() => alert("【デモ版】プライバシー設定画面へ遷移します")}>
                            <div className="item-left">
                                <span className="item-icon">🔒</span>
                                <span>プライバシーとセキュリティ</span>
                            </div>
                            <span className="item-arrow">＞</span>
                        </div>

                        <div className="settings-list-item text-red" onClick={() => { if (window.confirm("ログアウトしますか？")) { handleLogout(); } }}>
                            <div className="item-left">
                                <span className="item-icon">🚪</span>
                                <span>ログアウト</span>
                            </div>
                        </div>
                    </div>
                </main>
            )}

        { /* 下部ナビゲーションバー */}
        <nav className="sns-bottom-nav">
            <div className="nav-item" onClick={() => setCurrentTab("home")} style={{ opacity: currentTab === "home" ? 1 : 0.5 }}>🏠</div>
            <div className="nav-item" onClick={() => setCurrentTab("search")} style={{ opacity: currentTab === "search" ? 1 : 0.5 }}>🔍</div>
            <div className="nav-item" onClick={() => setCurrentTab("create")} style={{ opacity: currentTab === "create" ? 1 : 0.5 }}>➕</div>
            <div className="nav-item" onClick={() => setCurrentTab("inbox")} style={{ opacity: currentTab === "inbox" ? 1 : 0.5 }}>✉️</div>
            <div className="nav-item" onClick={() => setCurrentTab("settings")} style={{ opacity: currentTab === "settings" ? 1 : 0.5 }}>⚙️</div>
        </nav>

        {/*コメントボトムシート */}
        {activeCommnetPostId && (() => {
            //リアルタイム更新されているpostsの中から、今開いている投稿を探す
            const activePost = posts.find(p => p.id === activeCommnetPostId);
            if (!activePost) return null;

            return(
                <div style={{position : "fixed", top : 0, left : 0,width : "100%", height : "100%", backgroundColor : "rgba(0,0,0,0.5)",zIndex : 1000, display : "flex",flexDirection : "column", justifyContent : "flex-end"}}>
                    {/* モーダルの上の黒い部分を押したら閉じる*/}
                    <div style={{flex : 1}} onClick={() => setActiveCommnetPostId(null)}></div>

                    {/*ボトムシート全体 */}
                    <div style={{backgroundColor : "white", height : "70%", borderTopLeftRadius : "20px",borderTopRightRadius : "20px", display : "flex", flexDirection : "column", paddingBottom : "env(safe-area-inset-bottom)"}}>

                        {/*ヘッダー */}
                        <div style={{padding : "15px", textAlign : "center", borderBottom : "1px solid #ddd", position : "relative"}}>
                            <div style={{ width : "40px", height : "4px", backgroundColor : "#ccc", borderRadius : "2px", margin : "0 auto 10px"}}></div>
                            <h3 style={{margin : 0, fontSize : "16px"}}>コメント</h3>
                        </div>

                        {/*コメント一覧エリア */}
                        <div style={{flex : 1,overflowY : "auto", padding : "15px"}}>
                            {(!activePost.commentList || activePost.commentList.length === 0) ? (
                                <p style={{ textAlign : "center", color : "#999", marginTop: "20px"}}>まだコメントはありません。</p>
                            ) : (
                                activePost.commentList.map((c, i)=> (
                                    <div key={i} style={{marginBottom : "15px", display : "flex", gap : "10px"}}>
                                        <div style={{ width : "35px", height : "35px", borderRadius : "50%", backgroundColor : "#eee", flexShrink : 0}}></div>
                                        <div>
                                            <span style={{ fontWeight : "bold",marginRight : "8px", fontSize : "14px"}}>{c.userName}</span>
                                            <span style={{ fontSize : "14px", color : "#333"}}>{c.text}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/*　コメント入力エリア */}
                        <div style={{ padding : "10px 15px", borderTop : "1px solid #333", display : "flex", alignItems : "center"}}>
                            <div style={{ width : "35px", height : "35px", borderRadius : "50%", backgroundColor : "#333", marginRight : "10px"}}></div>
                            <input value={commentText} onChange={(e) => setCommnetText(e.target.value)} placeholder={`${activePost.userName}へのコメントを追加...`} style={{flex : 1,border : "none", outline : "none", fontSize : "14px"}}/>
                            <button onClick={() => handleCommnetSubmit(activePost.id)} style={{border : "none",background : "none",color : commentText.trim()? "#1a73e8" : "#999", fontWeight : "bold", cursor : "pointer"}}>送信</button>
                        </div>
                    </div>
                </div>
            )
        })}
    </div>
        
    );
}

