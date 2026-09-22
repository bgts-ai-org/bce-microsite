// One-off patch: wire the contact form to POST /api/contact (Gmail API backend)
// instead of a mailto: link. Preserves CRLF line endings — see memory note
// "bce-microsite-index-html-editing-hazards".
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../index.html', import.meta.url);
const src = readFileSync(file, 'utf8');
if (/[^\r]\n/.test(src)) throw new Error('index.html already has bare LF before patch');

/* Every replaceOnce below throws if its pattern is missing, so a second run
   used to fail loudly — correct on its own, but it made this script
   impossible to put in a build chain. Detect the finished state and exit
   quietly instead, so tools/build.mjs can run it unconditionally. */
if (src.includes('/api/contact')) {
  console.log('contact form already patched — nothing to do');
  process.exit(0);
}

function crlf(s) { return s.replace(/\r?\n/g, '\r\n'); }

function replaceOnce(text, from, to, label) {
  from = crlf(from); to = crlf(to);
  const i = text.indexOf(from);
  if (i === -1) throw new Error(`pattern not found: ${label}`);
  if (text.indexOf(from, i + 1) !== -1) throw new Error(`pattern not unique: ${label}`);
  return text.slice(0, i) + to + text.slice(i + from.length);
}

let out = src;

// 1. CSS: error-state tint for the tick icon, reusing --danger tokens.
out = replaceOnce(out,
  '.form-ok h4{color:var(--ink)}\r\n.form-ok p{font-size:.88rem;line-height:1.55;color:var(--ink-2)}',
  '.form-ok h4{color:var(--ink)}\r\n.form-ok p{font-size:.88rem;line-height:1.55;color:var(--ink-2)}\r\n.form-ok.is-err .tick{background:var(--danger-soft);color:var(--danger)}',
  'css tick error state'
);

// 2. Footer note under the submit button: no longer opens a mail client.
out = replaceOnce(out,
  '            <span class="i18n" data-lang="en">Opens your mail client — nothing is stored by this page.</span>\r\n            <span class="i18n" data-lang="tr">E-posta istemcinizi açar — bu sayfa hiçbir şey saklamaz.</span>',
  '            <span class="i18n" data-lang="en">Sent directly — nothing is stored by this page.</span>\r\n            <span class="i18n" data-lang="tr">Doğrudan gönderilir — bu sayfa hiçbir şey saklamaz.</span>',
  'form-foot note'
);

// 3. Success/error panel copy.
out = replaceOnce(out,
`        <div class="form-ok" id="form-ok" role="status">
          <span class="tick" aria-hidden="true">✓</span>
          <h4 data-i18n data-en="Your message is ready to send" data-tr="Mesajınız gönderilmeye hazır">Your message is ready to send</h4>
          <p class="i18n-b" data-lang="en">Your mail client should have opened with the message addressed to <b>opensource-ai@bgts.com</b>. If it did not, write to that address directly — it reaches the people who maintain the engine.</p>
          <p class="i18n-b" data-lang="tr">E-posta istemciniz, mesaj <b>opensource-ai@bgts.com</b> adresine yazılmış olarak açılmış olmalı. Açılmadıysa doğrudan bu adrese yazın — motoru geliştiren ekibe ulaşır.</p>
          <button type="button" class="btn btn-ghost btn-sm" id="form-back" style="align-self:flex-start" data-i18n data-en="Write another" data-tr="Yeni mesaj yaz">Write another</button>
        </div>`,
`        <div class="form-ok" id="form-ok" role="status">
          <span class="tick" id="form-ok-tick" aria-hidden="true">✓</span>
          <h4 id="form-ok-title" data-i18n data-en="Message sent" data-tr="Mesaj gönderildi">Message sent</h4>
          <div id="form-ok-success">
            <p class="i18n-b" data-lang="en">Thanks — your message reached <b>opensource-ai@bgts.com</b>. We will get back to you at the email address you provided.</p>
            <p class="i18n-b" data-lang="tr">Teşekkürler — mesajınız <b>opensource-ai@bgts.com</b> adresine ulaştı. Belirttiğiniz e-posta adresinden size dönüş yapacağız.</p>
          </div>
          <div id="form-ok-error" style="display:none">
            <p class="i18n-b" data-lang="en">Something went wrong and your message was not sent. Please write to <b>opensource-ai@bgts.com</b> directly.</p>
            <p class="i18n-b" data-lang="tr">Bir şeyler ters gitti ve mesajınız gönderilemedi. Lütfen doğrudan <b>opensource-ai@bgts.com</b> adresine yazın.</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" id="form-back" style="align-self:flex-start" data-i18n data-en="Write another" data-tr="Yeni mesaj yaz">Write another</button>
        </div>`,
  'form-ok panel'
);

// 4. Submit handler: POST JSON to /api/contact instead of building a mailto: link.
out = replaceOnce(out,
`    var body=[
      L("Name","Ad Soyad")+": "+$("#f-name").value,
      L("Email","E-posta")+": "+$("#f-email").value,
      L("Company","Şirket")+": "+($("#f-company").value||"—"),
      L("Phone","Telefon")+": "+($("#f-phone").value||"—"),
      "",
      $("#f-msg").value,
      "",
      "— "+L("Sent from the BGTS Context Engine microsite","BGTS Context Engine mikrositesinden gönderildi")
    ].join("\\n");
    var href="mailto:opensource-ai@bgts.com"
      +"?subject="+encodeURIComponent("BGTS Context Engine — "+($("#f-company").value||$("#f-name").value))
      +"&body="+encodeURIComponent(body);
    form.style.display="none";
    ok.classList.add("on");
    window.location.href=href;
  });`,
`    var submitBtn=form.querySelector(".form-submit");
    submitBtn.disabled=true;
    fetch("/api/contact",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        name:$("#f-name").value,
        email:$("#f-email").value,
        company:$("#f-company").value,
        phone:$("#f-phone").value,
        message:$("#f-msg").value,
        kvkk:kv.checked
      })
    }).then(function(r){ return r.json().then(function(d){ return {status:r.status, ok:d.ok}; }); })
      .then(function(r){
        form.style.display="none";
        ok.classList.toggle("is-err", !r.ok);
        $("#form-ok-success").style.display=r.ok?"":"none";
        $("#form-ok-error").style.display=r.ok?"none":"";
        $("#form-ok-tick").textContent=r.ok?"✓":"!";
        ok.classList.add("on");
      })
      .catch(function(){
        form.style.display="none";
        ok.classList.add("on","is-err");
        $("#form-ok-success").style.display="none";
        $("#form-ok-error").style.display="";
        $("#form-ok-tick").textContent="!";
      })
      .finally(function(){ submitBtn.disabled=false; });
  });`,
  'submit handler'
);

// 5. "Write another" reset must also clear the error state.
out = replaceOnce(out,
`  $("#form-back").addEventListener("click",function(){
    ok.classList.remove("on"); form.style.display=""; $("#f-name").focus();
  });`,
`  $("#form-back").addEventListener("click",function(){
    ok.classList.remove("on","is-err"); form.style.display=""; $("#f-name").focus();
  });`,
  'form-back handler'
);

if (/[^\r]\n/.test(out)) throw new Error('patch introduced bare LF');
writeFileSync(file, out, 'utf8');
console.log('index.html patched: contact form now posts to /api/contact');
