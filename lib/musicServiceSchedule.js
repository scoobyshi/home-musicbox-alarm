var cronschedule = require('cron').CronJob;
var sqlite3 = require('sqlite3'); // Add .verbose for more info
var PouchDB = require('pouchdb');
var pdb = new PouchDB('db/scheduler');
var job;

var test_schedule_cron = '00 33 17 * * *';
var test_schedule_playlist = 'spotify:user:nikerunclub:playlist:1tSdM0o0EX46kKdKFiDUdp';

var default_schedule = {
  "_id": "default1",
  "name": "Default Schedule",
  "type": "cron",
  "cron": "00 15 22 * * *",
  "playlistid": 'spotify:user:nikerunclub:playlist:1tSdM0o0EX46kKdKFiDUdp'
};

module.exports.initialSchedule = initialSchedule;
module.exports.updateSchedule = updateSchedule;
module.exports.showSchedule = showSchedule;

async function getSchedulePdb(id) {
  let schedule;

  try {
    schedule = await pdb.get(id);
  } catch (err) {
    if (err.name === 'not_found') {
      console.log("No Schedule Found.");
      schedule = default_schedule;
    } else {
      throw err;
    }
  }

  return schedule;
}

async function putSchedulePdb(current_schedule, attribute_type, new_attribute) {
  try {
    let modify_schedule = current_schedule;

    switch (attribute_type) {
      case 'cron':
        modify_schedule.cron = new_attribute;
        break;
      case 'playlist':
        modify_schedule.playlistid = new_attribute;
        break;
      default:
        console.log("Missing Attribute to Update.");
    }

    let result = await pdb.put(modify_schedule);
    console.log("Successful New Schedule: ", result);

    let return_sched = await pdb.get(result.id);
    return return_sched;

  } catch (err) {
    throw(err);
  }
}

async function spawnSchedulePdb(new_playlistid, new_cron) {

  // Instead provide list of changes, iterate

  try {
    let schedule = await getSchedulePdb(default_schedule._id);
    let updated_schedule = schedule;
    console.log(" *** Current Sched: ", schedule);

    if (new_playlistid) {
      console.log(" *** New Playlist ID: ", new_playlistid);

      try {
        updated_schedule = await putSchedulePdb(schedule, 'playlist', new_playlistid);
      } catch (err) {
        // If Error, Retry once with updated schedule
        console.log("Retrying Playlist Change.");
        try {
          schedule = await getSchedulePdb(default_schedule._id);
          updated_schedule = await putSchedulePdb(schedule, 'playlist', new_playlistid);
        } catch(err) {
          throw(err);
        }
      }

    }

    if (new_cron) {
      console.log(" *** New Cron: ", new_cron);

      try {
        updated_schedule = await putSchedulePdb(schedule, 'cron', new_cron);
      } catch (err) {
        // If Error, Retry once with updated schedule
        console.log("Retrying Cron Change.");
        try {
          schedule = await getSchedulePdb(default_schedule._id);
          updated_schedule = await putSchedulePdb(schedule, 'cron', new_cron);
        } catch(err) {
          throw(err);
        }
      }
    }

    console.log(" *** Updated Sched: ", updated_schedule);
    return updated_schedule;

  } catch (err) {
    throw(err);
  }

}

async function showSchedule(responsecb) {
  try {
    let schedule = await getSchedulePdb(default_schedule._id);
    responsecb.status(200).json(schedule);
  } catch (err) {
    responsecb.status(400).json({ "message": "failure" });
    throw(err);
  }
}

async function updateSchedule(playlistid, cron, responsecb) {
  let sched;
  let new_cron = JSON.parse(cron);

  try {
    sched = await spawnSchedulePdb(playlistid, new_cron);
    responsecb.status(200).json({ "message": "success" });
  } catch (err) {
    responsecb.status(400).json({ "message": "failure" });
    throw(err);
  }

  console.log("Updated Cron Schedule: ", sched);

  job.stop();
  job = new cronschedule({
    cronTime: sched.cron,
    onTick: () => {
      this.load(sched.playlistid, res => console.log("Response:", res));
      this.playback('play', res => console.log("Response:", res));
    },
    start: true,
    timeZone: 'America/Toronto'
  });

}

async function initialSchedule() {
  pdb.info().then( (info) => {
    console.log("PouchDB Info: ", info);
  });

  let sched;

  try {
    sched = await spawnSchedulePdb(test_schedule_playlist, test_schedule_cron);
  } catch (err) {
    throw(err);
  }

  console.log("Initial Cron Schedule:", sched);
  job = new cronschedule({
    cronTime: sched.cron,
    onTick: () => {
      this.load(sched.playlistid, res => console.log("Response:", res));
      this.playback('play', res => console.log("Response:", res));
    },
    start: true,
    timeZone: 'America/Toronto'
  });

}
