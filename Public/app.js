// app.js (updated for Modal Login + Modal Signup)
// Assumes window.supabase, window.APP_CONFIG already set by config.js

const SUPABASE = window.supabase;
const PROOFS_BUCKET = window.APP_CONFIG.PROOFS_BUCKET;
const CURRENCY = window.APP_CONFIG.CURRENCY || "৳";

const $ = (id) => document.getElementById(id);

// Simple message logger used across site
function msg(text) {
  const ul = $("messages-list");
  if (!ul) {
    // fallback console
    console.log(text);
    return;
  }
  const li = document.createElement("li");
  li.textContent = text;
  ul.prepend(li);
}

// Modal helpers
function openGlobalModal(html) {
  const modal = $("global-modal");
  const body = $("global-modal-body");
  body.innerHTML = html;
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}
function closeGlobalModal() {
  const modal = $("global-modal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}
$("global-modal-close")?.addEventListener("click", closeGlobalModal);

// Hook nav buttons to open modals
document.addEventListener("DOMContentLoaded", () => {
  const ln = $("btn-open-login");
  const su = $("btn-open-signup");
  if (ln) ln.addEventListener("click", renderLoginModal);
  if (su) su.addEventListener("click", renderSignupModal);

  // initial render
  init();
});

// ======= LOGIN MODAL =======
function renderLoginModal() {
  openGlobalModal(`
    <h3>Login</h3>
    <div id="modal-msg" style="color:#b91c1c;margin-bottom:8px;"></div>
    <input id="modal-email" class="input" type="email" placeholder="ইমেইল" />
    <div style="display:flex;gap:8px;">
      <input id="modal-pw" class="input" type="password" placeholder="পাসওয়ার্ড" />
      <button id="pw-toggle" class="btn btn-ghost" style="height:40px;">Show</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button id="modal-login-btn" class="btn">Login</button>
      <button id="modal-open-signup" class="btn btn-ghost">Sign Up</button>
    </div>
    <p style="margin-top:8px;font-size:13px;color:var(--muted);">লগইন সমস্যায় <a href="contact.html">Contact</a> করুন</p>
  `);

  // handlers
  setTimeout(() => {
    const toggle = $("pw-toggle");
    toggle.onclick = () => {
      const p = $("modal-pw");
      if (p.type === "password") { p.type = "text"; toggle.textContent = "Hide"; }
      else { p.type = "password"; toggle.textContent = "Show"; }
    };

    $("modal-open-signup").onclick = () => {
      renderSignupModal();
    };

    $("modal-login-btn").onclick = async () => {
      const email = $("modal-email").value.trim();
      const pw = $("modal-pw").value;
      const errDiv = $("modal-msg");
      errDiv.textContent = "";
      if (!email || !pw) { errDiv.textContent = "ইমেইল ও পাসওয়ার্ড দিন"; return; }

      try {
        const { error } = await SUPABASE.auth.signInWithPassword({ email, password: pw });
        if (error) { errDiv.textContent = "Login error: " + error.message; console.error(error); return; }
        msg("Logged in: " + email);
        closeGlobalModal();
        await postAuthUpdate();
      } catch (e) {
        errDiv.textContent = "Login failed";
        console.error(e);
      }
    };
  }, 50);
}

// ======= SIGNUP MODAL (phone required) =======
function renderSignupModal() {
  openGlobalModal(`
    <h3>Create Account</h3>
    <div id="modal-msg" style="color:#b91c1c;margin-bottom:8px;"></div>
    <input id="modal-su-email" class="input" type="email" placeholder="ইমেইল" />
    <input id="modal-su-phone" class="input" type="tel" placeholder="ফোন নম্বর (017XXXXXXXX)" />
    <div style="display:flex;gap:8px;">
      <input id="modal-su-pw" class="input" type="password" placeholder="পাসওয়ার্ড" />
      <button id="su-pw-toggle" class="btn btn-ghost" style="height:40px;">Show</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button id="modal-signup-btn" class="btn">Create Account</button>
      <button id="modal-open-login" class="btn btn-ghost">Login</button>
    </div>
    <p style="margin-top:8px;font-size:13px;color:var(--muted);">ফোন নম্বর অনিবার্য — সঠিক নম্বর দিন</p>
  `);

  setTimeout(() => {
    const toggle = $("su-pw-toggle");
    toggle.onclick = () => {
      const p = $("modal-su-pw");
      if (p.type === "password") { p.type = "text"; toggle.textContent = "Hide"; }
      else { p.type = "password"; toggle.textContent = "Show"; }
    };

    $("modal-open-login").onclick = () => {
      renderLoginModal();
    };

    $("modal-signup-btn").onclick = async () => {
      const email = $("modal-su-email").value.trim();
      const phone = $("modal-su-phone").value.trim();
      const pw = $("modal-su-pw").value;
      const errDiv = $("modal-msg");
      errDiv.textContent = "";

      if (!email || !phone || !pw) { errDiv.textContent = "ইমেইল, ফোন ও পাসওয়ার্ড সবগুলোই প্রয়োজন"; return; }
      if (!/^01[0-9]{9}$/.test(phone)) { errDiv.textContent = "সঠিক ফোন নম্বর দিন (017XXXXXXXX)"; return; }

      // store pending phone (for confirm flows or profile creation)
      try { localStorage.setItem("pending_phone", phone); } catch(e){}

      try {
        const { data, error } = await SUPABASE.auth.signUp({ email, password: pw });

        if (error) { errDiv.textContent = "Signup error: " + error.message; console.error(error); return; }

        // If signUp auto-logged-in and returned user immediately, create profile
        const createdUser = data?.user ?? null;
        if (createdUser) {
          try {
            await SUPABASE.from("user_profiles").insert([{ id: createdUser.id, phone, role: "user", balance: 0 }]);
          } catch (e) {
            // might fail due to RLS — admin can create or use edge function
            console.warn("profile insert warning", e);
          }
        }

        msg("Signup success — check email for confirmation if required");
        closeGlobalModal();
        await postAuthUpdate();

      } catch (e) {
        errDiv.textContent = "Signup failed";
        console.error(e);
      }
    };
  }, 50);
}

// ======= Post-auth updates (call after login/logout/signup) =======
async function postAuthUpdate() {
  // re-render UI parts: load packages, admin checks, etc.
  try {
    await renderAuthButtons();
    await loadPackages();
    await checkAdminMode();
  } catch (e) { console.error(e); }
}

// render auth-aware elements (updates nav if needed)
async function renderAuthButtons() {
  // this app uses modal login/signup; but we may want to show user email in header or admin-action
  // Example: if user is logged in, hide login/signup buttons
  const { data: { session } } = await SUPABASE.auth.getSession();
  const user = session?.user;
  const loginBtn = $("btn-open-login");
  const signupBtn = $("btn-open-signup");
  if (!loginBtn || !signupBtn) return;

  if (!user) {
    loginBtn.style.display = "";
    signupBtn.style.display = "";
  } else {
    loginBtn.style.display = "none";
    signupBtn.style.display = "none";
  }
}

// ======= Other existing app functions (packages, buy flow, admin check) =======
// Keep your previous implementations here (loadPackages, openBuyModal, checkAdminMode, etc.)
// I'll include simplified versions for completeness:

async function loadPackages() {
  try {
    const { data, error } = await SUPABASE.from("packages").select("*").order("created_at", { ascending: false });
    if (error) { msg("Packages load error: " + error.message); return; }
    const list = $("packages-list");
    if (!list) return;
    list.innerHTML = "";
    (data || []).forEach(p => {
      const div = document.createElement("div");
      div.className = "card-item";
      div.innerHTML = `
        <div class="card-title">${p.name}</div>
        <div class="card-sub">${CURRENCY}${p.price} • ${p.percent_per_12h}% / 12h</div>
        <div class="card-desc">${p.description || ""}</div>
        <div class="card-actions"><button class="btn buy-btn">Buy</button></div>
      `;
      div.querySelector(".buy-btn").onclick = () => openBuyModal(p);
      list.appendChild(div);
    });
  } catch (e) { msg("Load packages failed: " + e.message); }
}

async function openBuyModal(pkg) {
  const { data: { session } } = await SUPABASE.auth.getSession();
  const user = session?.user;
  if (!user) { msg("Please login first"); renderLoginModal(); return; }

  const { data, error } = await SUPABASE.from("purchases").insert([{ user_id: user.id, package_id: pkg.id, price_paid: pkg.price, status: "pending" }]).select().single();
  if (error) { msg("Purchase create error: " + error.message); return; }

  const purchase = data;
  openGlobalModal(`
    <h3>বিকাশে টাকা পাঠান</h3>
    <p>প্যাকেজ: <strong>${pkg.name}</strong></p>
    <p>টাকা পাঠাবেন: <strong>${CURRENCY}${pkg.price}</strong></p>
    <p>TX ID/স্ক্রিনশট আপলোড করুন — প্রশাসক যাচাই করার পর অ্যাক্টিভ হবে।</p>
    <input id="proof-tx" class="input" placeholder="বিকাশ TX ID"/><br/><br/>
    <input id="proof-file" type="file" accept="image/*"/><br/><br/>
    <button id="upload-proof" class="btn">Upload Proof</button>
  `);

  setTimeout(() => {
    $("upload-proof").onclick = async () => {
      const tx = $("proof-tx").value;
      const file = $("proof-file").files[0];
      if (!file) { msg("Please pick an image"); return; }
      const path = `proofs/${purchase.id}/${file.name}`;
      const { error: upErr } = await SUPABASE.storage.from(PROOFS_BUCKET).upload(path, file, { upsert: true });
      if (upErr) { msg("Upload error: " + upErr.message); return; }
      const { error: pfErr } = await SUPABASE.from("payment_proofs").insert([{ purchase_id: purchase.id, uploaded_by: (await SUPABASE.auth.getUser()).data?.user?.id, storage_path: path, tx_id: tx }]);
      if (pfErr) { msg("Proof record error: " + pfErr.message); return; }
      msg("Proof uploaded — admin will verify.");
      closeGlobalModal();
    };
  }, 50);
}

// check admin mode (show admin actions)
async function checkAdminMode() {
  const session = (await SUPABASE.auth.getSession()).data.session;
  const user = session?.user;
  const adminActions = document.getElementById("admin-actions");
  if (!adminActions) return;
  if (!user) { adminActions.style.display = "none"; return; }
  try {
    const { data: profile, error } = await SUPABASE.from("user_profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") { adminActions.style.display = "none"; return; }
    adminActions.style.display = "";
  } catch (e) { adminActions.style.display = "none"; }
}

// Initialisation
async function init() {
  await renderAuthButtons();
  await loadPackages();
  await checkAdminMode();

  // Auth listener to update UI
  SUPABASE.auth.onAuthStateChange(async () => {
    await renderAuthButtons();
    await loadPackages();
    await checkAdminMode();
  });
}
