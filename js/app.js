// ========== APP STATE & ENTRY POINT ==========
let participants = [];
let members = [];
let activities = [];
let eventos = [];
let points = {};
let savedPoints = {}; // snapshot of points last persisted to Firebase
let pointsTimestamps = {}; // last-registered date/time per "pId-aId" key (persisted inside ja_points)
let editModeKeys = new Set(); // keys currently in replace/edit mode

const STEP = 10;

// ========== INIT ==========
function init() {
  renderEmojiPicker();
  renderParticipants();
  renderMembers();
  renderActivities();
  renderEventos();
  renderAssignTable();
  renderSummary();
  renderRanking();
  populateMemberGPSelect();
}

function save() {
  db.ref('/').update({
    ja_participants: participants,
    ja_members: members,
    ja_activities: activities,
    // Timestamps are stored inside the ja_points node so they can be recovered from there
    ja_points: { ...points, _timestamps: pointsTimestamps }
  }).catch(err => {
    console.error('Error guardando datos en Firebase:', err);
    alert('⚠️ No se pudieron guardar los datos. Verifica tu conexión y la configuración de Firebase.');
  });
}

// ========== START ==========
async function loadFromFirebase() {
  try {
    const [participantsSnap, membersSnap, activitiesSnap, eventsSnap, pointsSnap] = await Promise.all([
      db.ref('ja_participants').once('value'),
      db.ref('ja_members').once('value'),
      db.ref('ja_activities').once('value'),
      db.ref('ja_eventos').once('value'),
      db.ref('ja_points').once('value')
    ]);
    participants = participantsSnap.val() || [];
    members = membersSnap.val() || [];
    activities = activitiesSnap.val() || [];
    eventos = eventsSnap.val() || [];
    const rawPoints = pointsSnap.val() || {};
    // Extract the persisted timestamps and keep the points map as a pure numeric map
    pointsTimestamps = rawPoints._timestamps || {};
    delete rawPoints._timestamps;
    points = rawPoints;
    savedPoints = { ...points }; // snapshot of persisted values
  } catch (err) {
    console.error('Error cargando datos desde Firebase:', err);
    alert('⚠️ No se pudieron cargar los datos. Verifica tu conexión y la configuración de Firebase.');
  }
  init();
  populateAssignSelect();
}

initAuth();
