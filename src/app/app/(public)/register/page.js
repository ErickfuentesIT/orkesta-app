// src/app/app/register/page.js
"use client";
import FirstForm from "../../components/common/FirstForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div>
      <div className="wrapper">
        <aside className="left">
          <section>
            {/* el logo ahora está en /public */}
            <Image
              src="/logo_orkesta.png"
              width="700"
              height="500"
              alt="Orkesta"
            />
          </section>
        </aside>

        <main className="right">
          <div className="login-wrap">
            {/* <- className, no class */}
            <FirstForm title="Registrarse" isLogin={false} />
          </div>
        </main>
      </div>
    </div>
  );
}
