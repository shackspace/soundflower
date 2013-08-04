import json
import os.path
import subprocess
import os
import sys
import os.path
from time import sleep

os.chdir(os.path.realpath(os.path.dirname(sys.argv[0])))
here = os.path.abspath(os.getcwd())


MPD_FOLDER = "/tmp/soundflower.mpd/"
MPD_START_PORT = 6700

class SoundClient:
    client = None

    def __init__(self, ident):
        from mpd import MPDClient
        # TODO fix this hack (this resolves circular deps
        self.port = MPD_START_PORT+ ident
        self.client = MPDClient()
        self.client.timeout = 10
        self.client.idletimeout = None

    def __enter__(self):
        self.client.connect('localhost', self.port)
        # normalize params again
        self.client.repeat(0)
        return self.client

    def __exit__(self, type, value, traceback):
        self.client.close()
        self.client.disconnect()


def get_all_files(folder):
    ret = []
    for index, f in enumerate(os.listdir(folder)):
        if '.wav' in f:
            ret.append({'name': f, 'id': index})
    return ret

def stop_sound(ident):
    with SoundClient(ident) as mpc:
        mpc.stop()
        mpc.clear()

def force_play_file(ident,filename):
    stop_sound(ident)
    play_file(ident,filename)

def play_file(ident, filename):

    if not get_running(ident):
        with SoundClient(ident) as mpc:
            mpc.clear()
            mpc.add(filename)
            mpc.play()
    else:
        raise Exception('already running or something')


def loop_file(ident, filename):
    # i come in hell for this, sorry...

    if not get_running(ident):
        with SoundClient(ident) as mpc:
            mpc.clear()
            mpc.add(filename)
            mpc.repeat(1)
            mpc.play()
    else:
        raise Exception('already running or something')


def get_running(ident):
    ident = int(ident)
    try:
        with SoundClient(ident) as mpc:
            return 1 if mpc.status()['state'] == 'play' else 0
    except:
        return 0


def all_the_channels():
    channels = []
    ident = 0
    proc = subprocess.Popen(['aplay', '-l'], stdout=subprocess.PIPE)
    proc.wait()
    out = proc.communicate()[0]
    for line in out.splitlines():
        line = line.decode()
        if 'card' in line:
            c, d, name = line.split(':')
            card = int(c.split()[1])
            device = int(d.split(',')[1].split()[1])
            name = name.split('[')[0]
            channels.append({'id': ident,
                             'mpd_port': MPD_START_PORT +ident,
                             'card': card,
                             'device': device,
                             'state': get_running(ident),
                             'file': get_running_file(ident),
                             'name': name.strip()})
            ident = ident + 1
    return channels


def get_running_file(ident):
    try:
        with SoundClient(ident) as mpc:
            return mpc.currentsong().get('file','')
    except:
        return ''


def init_mpds(sound_folder):
    sound_folder = os.path.abspath(sound_folder)
    try:
        os.mkdir(MPD_FOLDER)
    except:
        pass
    for c in all_the_channels():
        print(c)
        mpd_path = MPD_FOLDER+str(c['id'])
        mpd_conf = mpd_path+'.conf'
        try:
            pid = int(open(mpd_path+'.pid').read())
            os.kill(pid, 3)
            sleep(1)
            print('%d killed' % pid)
        except Exception as e:
            print(e)
            pass
        with open(mpd_conf, 'w+') as conf:
            print('writing config %s.conf' % mpd_path)
            conf.write("""playlist_directory "{0}"
music_directory        "{1}"
db_file "{2}.db"
log_file           "{2}.log"
pid_file "{2}.pid"
state_file "{2}.state"
#user 'root'
port "{3}"
gapless_mp3_playback           "no"
zeroconf_enabled "no"
volume_normalization       "no"
bind_to_address "127.0.0.1"

audio_output {{
   type        "alsa"
   name        "My ALSA Device"
   device      "hw:{4},{5}"
#  format      "44100:16:2"    # optional
#  mixer_type      "hardware"  # optional
#  mixer_device    "default"   # optional
#  mixer_control   "PCM"       # optional
#  mixer_index "0"     # optional
}}""".format(sound_folder,
             sound_folder, mpd_path,
             c['mpd_port'],
             c['card'], c['device']))
        os.system('mpd %s' % mpd_conf)


def run_profile():
    pass

if __name__ == "__main__":
    init_mpds()
