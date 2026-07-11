export default function FolderSelect(props) {
  var role = props.role;
  var onSelectFolder = props.onSelectFolder;
  var onLogout = props.onLogout;

  return (
    <div className="home-wrapper">
      <div className="home-hero">
        <img src="/logo.png" alt="Katanova" className="home-logo" />
        <p className="home-subtitle">どちらのフォルダを開きますか？</p>
      </div>

      <div className="home-list">
        {role === "internal" && (
          <button className="folder-card" onClick={function () { onSelectFolder("internal"); }}>
            <span className="folder-card-icon">🏠</span>
            <span className="folder-card-body">
              <span className="folder-card-title">イノゼロ用フォルダ</span>
              <span className="folder-card-desc">チーム内の議論・作業用ボード</span>
            </span>
            <span className="folder-card-arrow">開く →</span>
          </button>
        )}

        <button className="folder-card" onClick={function () { onSelectFolder("external"); }}>
          <span className="folder-card-icon">🌐</span>
          <span className="folder-card-body">
            <span className="folder-card-title">外部共有用フォルダ</span>
            <span className="folder-card-desc">外部の人にも見せてよいボード</span>
          </span>
          <span className="folder-card-arrow">開く →</span>
        </button>
      </div>

      {role === "external" && (
        <p className="folder-note">
          外部共有用のアカウントでログインしています。表示できるのは共有フォルダのみです。
        </p>
      )}

      {onLogout && (
        <button className="home-back logout-button" onClick={onLogout}>
          ログアウト
        </button>
      )}
    </div>
  );
}
