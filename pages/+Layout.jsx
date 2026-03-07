import "../assets/global.css";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      {children}
    </div>
  );
}
