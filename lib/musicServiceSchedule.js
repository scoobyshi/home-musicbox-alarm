var cronschedule = require('cron').CronJob;
var sqlite3 = require('sqlite3'); // Add .verbose for more info
var PouchDB = require('pouchdb');
var pdb = new PouchDB('db/scheduler');
var job;

module.exports.autoSchedule = autoSchedule;
module.exports.updateSchedule = updateSchedule;
module.exports.showSchedule = showSchedule;

async function getSchedulePdb(id, default_schedule) {
  try {
    let sched_result = await pdb.get(id);
    return sched_result;
  } catch (err) {
    if (err.name === 'not_found') {
      console.log("No Schedule Found.");
      return default_schedule;
    } else {
      throw err;
    }
  }
}

async function putSchedulePdb(current_schedule, new_cron) {
  try {
    let modify_schedule = current_schedule;
    modify_schedule.cron = new_cron;

    console.log("Existing Schedule 2: ", current_schedule);
    console.log("Adjust Schedule... to: ", new_cron);

    let result = await pdb.put(modify_schedule);
    console.log("Successful New Schedule: ", result);
    // new_schedule = await pdb.get(result.id);
    let return_sched = await pdb.get(result.id);

    return return_sched;

  } catch (err) {
    throw(err);
  }
}

async function spawnSchedulePdb() {
  pdb.info().then( (info) => {
    console.log("PouchDB Info: ", info);
  });

  let default_schedule = {
    "_id": "default1",
    "name": "Default Schedule",
    "type": "cron",
    "cron": "00 15 22 * * *"
  };

  try {
    console.log("Trying New Flow.");

    let current_schedule = await getSchedulePdb('default1', default_schedule);
    console.log("New Flow, Current Sched: ", current_schedule);

    let updated_schedule = await putSchedulePdb(current_schedule, '00 18 30 * * *');
    console.log("New Flow, Final Sched: ", updated_schedule);

  } catch (err) {
    throw(err);
  }

  let new_schedule;

  pdb.get('default1').catch( (err) => {
    if (err.name === 'not_found') {
      console.log("No Schedule Found.");
      return default_schedule;
    } else {
      throw err;
    }
  }).then( async (doc) => {

    console.log("Existing Schedule: ", doc);
    console.log("Adjust Schedule...");

    doc.cron = "00 16 22 * * *";
    let result = await pdb.put(doc);
    console.log(result);
    new_schedule = await pdb.get(result.id);

  }).catch( (err) => {
    // handle errors
  });

  return await new_schedule;
}

function showSchedule(responsecb) {

  var db = new sqlite3.Database('./db/schedule.sqlite3');
  var scheduleDetail = [];
  var i = 0;

  db.all("SELECT id, playlistid, cron FROM playschedule", (err, rows) => {
    rows.forEach(function (row) {
      console.log(row.id, row.playlistid, row.cron);
      scheduleDetail[i] = row;
      i++;
    });

    // Return only the first alarm scheduled, for now
    responsecb.status(200).json({
      "id": scheduleDetail[0].id,
      "playlistid": scheduleDetail[0].playlistid,
      "cron": scheduleDetail[0].cron
    });

  });

  db.close();

}

function updateSchedule(playlistid, cron, responsecb) {

  var db = new sqlite3.Database('./db/schedule.sqlite3');
  var scheduleDetail = [];

  db.run("update playschedule set playlistid = ?, cron=" + cron + " where id=1;", playlistid);
  db.close();

  responsecb.status(200).json({ "message": "success" });

  console.log("Update Schedule Cron Start:" + JSON.parse(cron));

  // Query param should look like cron="00 15 21 * * *", with double quotes
  var nextcron = JSON.parse(cron);

  job.stop();
  job = new cronschedule({
    cronTime: nextcron,
    onTick: () => {
      this.load(playlistid, res => console.log("Response:", res));
      this.playback('play', res => console.log("Response:", res));
    },
    start: true,
    timeZone: 'America/Toronto'
  });

}

async function autoSchedule() {

  let sched = await spawnSchedulePdb();
  console.log("New Schedule: ", sched);

  var db = new sqlite3.Database('./db/schedule.sqlite3');
  var scheduleDetail = [];
  var i = 0;

  // db.get('SELECT * FROM playschedule WHERE id = ?', req.params.id);
  db.all("SELECT id, playlistid, cron FROM playschedule", (err, rows) => {
    rows.forEach(function (row) {
      console.log(row.id, row.playlistid, row.cron);
      scheduleDetail[i] = row;
      i++;
    });

    // myScheduleDate = new Date(scheduleDetail[0].startdatetime);

    var myScheduleCronStart = scheduleDetail[0].cron;
    // var myScheduleCronStart = '44 9 * * *';
    var myPlaylist = scheduleDetail[0].playlistid;
    // console.log("Date from DB: ", myScheduleDate, "Testing Local:", myScheduleDate.toLocaleString());
    console.log("Schedule Cron Start:", myScheduleCronStart);

    job = new cronschedule({
      cronTime: myScheduleCronStart,
      onTick: () => {
        this.load(myPlaylist, res => console.log("Response:", res));
        this.playback('play', res => console.log("Response:", res));
      },
      start: true,
      timeZone: 'America/Toronto'
    });

  });

  db.close();
}
