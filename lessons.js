// Written lessons enhancements. No file uploads or Storage dependencies.
document.getElementById("tpane-lessons").outerHTML="<div id=\"tpane-lessons\" class=\"tpane\">\n      <div class=\"panel\">\n        <div class=\"section-hdr\" id=\"lessonFormHeading\">إضافة درس مكتوب</div>\n        <div id=\"lessonMsg\" class=\"auth-error\" style=\"display:none\"></div>\n        <div class=\"add-student-form\">\n          <div>\n            <label class=\"flabel\" style=\"font-size:.72rem;margin-bottom:4px\">عنوان الدرس</label>\n            <input type=\"text\" id=\"lessonTitle\" aria-label=\"عنوان الدرس\" maxlength=\"160\" class=\"tinput\" placeholder=\"مثال: همزة الوصل والقطع\">\n          </div>\n          <div class=\"form-row\">\n            <div>\n              <label class=\"flabel\" style=\"font-size:.72rem;margin-bottom:4px\">الصف</label>\n              <select id=\"lessonGrade\" aria-label=\"صف الدرس\" class=\"tselect\">\n                <option value=\"أول ثانوي\">الصف الأول الثانوي</option>\n                <option value=\"تاني ثانوي\" selected>الصف الثاني الثانوي</option>\n                <option value=\"تالت ثانوي\">الصف الثالث الثانوي</option>\n              </select>\n            </div>\n            <div>\n              <label class=\"flabel\" style=\"font-size:.72rem;margin-bottom:4px\">القسم/الموضوع</label>\n              <input type=\"text\" id=\"lessonSection\" aria-label=\"القسم أو الموضوع\" maxlength=\"80\" class=\"tinput\" placeholder=\"مثال: نحو\">\n            </div>\n          </div>\n          <div>\n            <label class=\"flabel\" style=\"font-size:.72rem;margin-bottom:4px\">محتوى الدرس</label>\n            <textarea id=\"lessonContent\" aria-label=\"محتوى الدرس المكتوب\" class=\"tinput\" rows=\"12\" maxlength=\"60000\" placeholder=\"اكتب شرح الدرس والأمثلة والتدريبات هنا. سيظهر النص للطالب بنفس ترتيب السطور.\"></textarea>\n          </div>\n          <div><label class=\"flabel\" for=\"lessonYoutube\">رابط فيديو يوتيوب (اختياري)</label><input type=\"url\" id=\"lessonYoutube\" class=\"tinput\" dir=\"ltr\" maxlength=\"500\" placeholder=\"https://www.youtube.com/watch?v=...\"></div>\n          <button class=\"tbtn gold full\" id=\"lessonSaveBtn\" onclick=\"saveLesson()\">نشر الدرس</button>\n          <button class=\"tbtn navy full\" id=\"lessonCancelBtn\" style=\"display:none\" onclick=\"resetLessonForm()\">إلغاء التعديل</button>\n        </div>\n      </div>\n      <div class=\"panel\">\n        <div class=\"section-hdr\">\n          <span>الدروس المنشورة</span>\n          <button class=\"tbtn navy\" onclick=\"loadTeacherLessons()\" style=\"font-size:.7rem;padding:6px 12px\">تحديث</button>\n        </div>\n        <select id=\"lessonsGradeFilter\" class=\"tselect\" onchange=\"loadTeacherLessons()\" style=\"margin-bottom:10px\">\n          <option value=\"\">كل الصفوف</option>\n          <option value=\"أول ثانوي\">الصف الأول الثانوي</option>\n          <option value=\"تاني ثانوي\">الصف الثاني الثانوي</option>\n          <option value=\"تالت ثانوي\">الصف الثالث الثانوي</option>\n        </select>\n        <div id=\"teacherLessonsList\">\n          <div class=\"empty-state\"><span class=\"eicon\"><svg class=ic aria-hidden=true><use href=#i-book-open></use></svg></span>جاري التحميل...</div>\n        </div>\n      </div>\n    </div>";
document.getElementById("spane-lessons").outerHTML="<div class=\"spane\" id=\"spane-lessons\">\n      <div class=\"section-hdr\">دروسك المكتوبة</div>\n      <div style=\"display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap\"><input id=\"studentLessonSearch\" aria-label=\"ابحث في الدروس\" class=\"tinput\" placeholder=\"ابحث عن درس...\" style=\"flex:2;min-width:140px\" oninput=\"renderStudentLessons()\"><select id=\"studentLessonSection\" aria-label=\"قسم الدروس\" class=\"tselect\" style=\"flex:1;min-width:120px\" onchange=\"renderStudentLessons()\"><option value=\"\">كل الأقسام</option></select><button class=\"tbtn navy\" onclick=\"loadStudentLessons()\">تحديث</button></div>\n      <div id=\"studentLessonsBox\" aria-live=\"polite\"></div>\n      </div>";
let studentLessonsCache = [];
function lessonEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function lessonVideoId(raw) {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return '';
    const host = u.hostname.toLowerCase();
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    if (['youtube.com','www.youtube.com','m.youtube.com'].includes(host)) {
      id = u.pathname === '/watch' ? u.searchParams.get('v') : (/^\/(shorts|embed)\//.test(u.pathname) ? u.pathname.split('/')[2] : '');
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : '';
  } catch(e) { return ''; }
}
function lessonBody(l) {
  const videoId = lessonVideoId(l.youtubeUrl);
  return '<div style="white-space:pre-wrap;overflow-wrap:anywhere;line-height:2.1;font-size:.94rem;padding:14px 2px">' + lessonEscape(l.content) + '</div>' + (videoId ? '<a class="tbtn navy" style="display:inline-flex;text-decoration:none;margin:8px 0" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v=' + videoId + '">شاهد فيديو الشرح على يوتيوب ↗</a>' : '');
}
async function loadStudentLessons() {
  const box = document.getElementById('studentLessonsBox');
  if (!box || !currentStudent) return;
  studentLessonsCache = [];
  box.style.display = 'block';
  box.innerHTML = '<div class="empty-state">جاري تحميل دروسك...</div>';
  try {
    const snap = await db.collection('lessons').where('grade', '==', currentStudent.grade).get();
    studentLessonsCache = snap.docs.map(d => ({...d.data(), id:d.id})).sort((a,b) => ((b.createdAt && b.createdAt.seconds)||0) - ((a.createdAt && a.createdAt.seconds)||0));
    const select = document.getElementById('studentLessonSection');
    const selected = select.value;
    select.innerHTML = '<option value="">كل الأقسام</option>' + [...new Set(studentLessonsCache.map(l => l.sec || 'عام'))].sort().map(sec => '<option value="'+lessonEscape(sec)+'">'+lessonEscape(sec)+'</option>').join('');
    if ([...select.options].some(o => o.value === selected)) select.value = selected;
    renderStudentLessons();
  } catch(e) { box.innerHTML = '<div class="empty-state">تعذّر تحميل الدروس. اضغط تحديث للمحاولة مرة أخرى.</div>'; }
}
function renderStudentLessons() {
  const box = document.getElementById('studentLessonsBox');
  const q = document.getElementById('studentLessonSearch').value.trim().toLowerCase();
  const sec = document.getElementById('studentLessonSection').value;
  const lessons = studentLessonsCache.filter(l => (!sec || (l.sec || 'عام') === sec) && (!q || [l.title,l.sec,l.content].join(' ').toLowerCase().includes(q)));
  box.innerHTML = lessons.length ? '<p style="font-size:.78rem;color:var(--muted);margin-bottom:10px">'+lessons.length+' درس متاح</p>' + lessons.map(l => '<details class="panel" style="padding:14px;margin-bottom:12px"><summary style="cursor:pointer;line-height:1.8;font-weight:900;overflow-wrap:anywhere">'+lessonEscape(l.title)+' <span class="exammgmt-chip">'+lessonEscape(l.sec || 'عام')+'</span></summary>'+lessonBody(l)+'</details>').join('') : '<div class="empty-state">'+(studentLessonsCache.length ? 'مفيش دروس مطابقة للبحث' : 'مفيش دروس متاحة لصفك دلوقتي')+'</div>';
}


let teacherLessonsCache = [];
let editingLessonId = null;
let lessonSaveBusy = false;
function resetLessonForm() {
  editingLessonId = null;
  ['lessonTitle','lessonSection','lessonContent','lessonYoutube'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('lessonFormHeading').textContent = 'إضافة درس مكتوب';
  document.getElementById('lessonSaveBtn').textContent = 'نشر الدرس';
  document.getElementById('lessonCancelBtn').style.display = 'none';
  document.getElementById('lessonMsg').style.display = 'none';
}
function editLesson(id) {
  if (lessonSaveBusy) return;
  const l = teacherLessonsCache.find(x => x.id === id); if (!l) return;
  editingLessonId = id;
  document.getElementById('lessonTitle').value = l.title || '';
  document.getElementById('lessonGrade').value = l.grade;
  document.getElementById('lessonSection').value = l.sec || '';
  document.getElementById('lessonContent').value = l.content || '';
  document.getElementById('lessonYoutube').value = l.youtubeUrl || '';
  document.getElementById('lessonFormHeading').textContent = 'تعديل الدرس';
  document.getElementById('lessonSaveBtn').textContent = 'حفظ التعديلات';
  document.getElementById('lessonCancelBtn').style.display = 'block';
  document.getElementById('lessonMsg').style.display = 'none';
  document.getElementById('lessonFormHeading').scrollIntoView({behavior:'smooth',block:'start'});
}
async function saveLesson() {
  if (lessonSaveBusy) return;
  const get = id => document.getElementById(id).value.trim();
  const title = get('lessonTitle'), grade = get('lessonGrade'), sec = get('lessonSection') || 'عام', content = get('lessonContent'), youtubeRaw = get('lessonYoutube');
  const msg = document.getElementById('lessonMsg');
  const say = text => {msg.textContent = text; msg.style.display = 'block';};
  if (!title || !content) {say('اكتب عنوان الدرس ومحتواه أولاً');return;}
  if (title.length > 160 || sec.length > 80 || content.length > 60000 || !GRADES_LIST.includes(grade)) {say('راجع طول النص والصف المحدد');return;}
  const videoId = lessonVideoId(youtubeRaw);
  if (youtubeRaw && !videoId) {say('اكتب رابط فيديو يوتيوب صحيح يبدأ بـ https:// أو اتركه فارغًا');return;}
  const btn = document.getElementById('lessonSaveBtn');
  lessonSaveBusy = true; btn.disabled = true; document.getElementById('lessonCancelBtn').disabled = true; btn.textContent = 'جاري الحفظ...';
  try {
    const data = {title,grade,sec,content,youtubeUrl:videoId ? 'https://www.youtube.com/watch?v='+videoId : '',updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    if (editingLessonId) await db.collection('lessons').doc(editingLessonId).update(data);
    else await db.collection('lessons').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    resetLessonForm(); say('تم حفظ الدرس. يظهر الآن لطلاب الصف المحدد.');
    await loadTeacherLessons();
  } catch(e) {say('تعذّر حفظ الدرس. المحتوى ما زال موجودًا، حاول مرة أخرى.');}
  finally {lessonSaveBusy = false;btn.disabled = false;document.getElementById('lessonCancelBtn').disabled = false;btn.textContent = editingLessonId ? 'حفظ التعديلات' : 'نشر الدرس';}
}
async function loadTeacherLessons() {
  const list = document.getElementById('teacherLessonsList');
  const grade = document.getElementById('lessonsGradeFilter').value;
  list.innerHTML = '<div class="empty-state">جاري تحميل الدروس...</div>';
  try {
    const snap = await db.collection('lessons').get();
    teacherLessonsCache = snap.docs.map(d => ({...d.data(),id:d.id})).sort((a,b) => ((b.createdAt && b.createdAt.seconds)||0)-((a.createdAt && a.createdAt.seconds)||0));
    const lessons = teacherLessonsCache.filter(l => !grade || l.grade === grade);
    list.innerHTML = lessons.length ? lessons.map(l => '<div class="exammgmt-card" style="margin-bottom:12px"><div class="exammgmt-title">'+lessonEscape(l.title)+'</div><div class="exammgmt-meta"><span class="exammgmt-chip">'+lessonEscape(gradeLabel(l.grade || ''))+'</span><span class="exammgmt-chip">'+lessonEscape(l.sec || 'عام')+'</span></div><details><summary style="cursor:pointer;margin-top:10px">معاينة المحتوى</summary>'+lessonBody(l)+'</details><div style="display:flex;gap:8px;margin-top:12px"><button class="tbtn navy" data-lesson-edit="'+lessonEscape(l.id)+'">تعديل</button><button class="tbtn red" data-lesson-delete="'+lessonEscape(l.id)+'">حذف</button></div></div>').join('') : '<div class="empty-state">لسه مفيش دروس منشورة للصف ده</div>';
  } catch(e) {list.innerHTML = '<div class="empty-state">تعذّر تحميل الدروس. اضغط تحديث للمحاولة مرة أخرى.</div>';}
}
document.getElementById('teacherLessonsList').addEventListener('click', e => {
  const edit = e.target.closest('[data-lesson-edit]'), del = e.target.closest('[data-lesson-delete]');
  if (edit) editLesson(edit.dataset.lessonEdit);
  if (del) deleteLesson(del.dataset.lessonDelete);
});
async function deleteLesson(id) {
  if (lessonSaveBusy || !confirm('حذف الدرس ده نهائيًا؟')) return;
  try {
    await db.collection('lessons').doc(id).delete();
    if (editingLessonId === id) resetLessonForm();
    await loadTeacherLessons();
  } catch(e) {alert('تعذّر حذف الدرس. حاول مرة أخرى.');}
}
