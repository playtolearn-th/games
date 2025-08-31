async function loginWithGoogle() {
  hideAlert?.();
  setLoading?.(loginForm, true);

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    // 1) ลอง popup ก่อน (สะดวกสุดสำหรับผู้ใช้ส่วนใหญ่)
    await auth.signInWithPopup(provider);
    // สำเร็จ → onAuthStateChanged จะ redirect ให้
  } catch (err) {
    console.warn("Popup sign-in failed, trying redirect:", err?.code || err);

    // เงื่อนไขที่ควร fallback เป็น redirect ทันที
    const fallbackCodes = new Set([
      "auth/popup-blocked",
      "auth/cancelled-popup-request",
      "auth/popup-closed-by-user",
      "auth/unauthorized-domain", // เผื่อโดเมนยังไม่อยู่ใน Authorized domains
      "auth/operation-not-supported-in-this-environment"
    ]);

    if (fallbackCodes.has(err?.code)) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await auth.signInWithRedirect(provider);
        // กลับจาก redirect แล้ว onAuthStateChanged จะทำงานเอง
        return;
      } catch (err2) {
        showAlert?.("danger", translateError?.(err2.code, err2.message) || "ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
      }
    } else {
      showAlert?.("danger", translateError?.(err.code, err.message) || "ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
    }
  } finally {
    setLoading?.(loginForm, false);
  }
}
