import mpdrunner
profile_name = 'bling'
SOUND_FOLDER = '../sounds/%s' % profile_name
import random


def random_sleep(mi,ma):
    import time
    time.sleep(mi+ma*random.random())
    return True

def run_profile():
    mpds = mpdrunner.all_the_channels()
    while random_sleep(0, 5):
        speaker = random.choice(mpds)
        fname = 'c0%02d.mp3' %random.randint(0,26)
        mpdrunner.force_play_file(speaker['id'],fname)
        print("playing '%s' on %d" %(fname,speaker['id']))
            

if __name__ == "__main__":
    mpdrunner.init_mpds(SOUND_FOLDER)
    run_profile()
