<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class JadwalUjianMail extends QueuedMailable
{
    use Queueable, SerializesModels;

    public $pendaftaran;
    public $jadwal;

    public function __construct($pendaftaran, $jadwal)
    {
        $this->pendaftaran = $pendaftaran;
        $this->jadwal = $jadwal;
    }

    public function build()
    {
        return $this->subject('Undangan Ujian Lanjutan RPL - SIRPL Poliban')
                    ->view('emails.jadwal_ujian');
    }
}
