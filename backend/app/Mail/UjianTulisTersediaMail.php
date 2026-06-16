<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class UjianTulisTersediaMail extends QueuedMailable
{
    use Queueable, SerializesModels;

    public $pendaftaran;

    public function __construct($pendaftaran)
    {
        $this->pendaftaran = $pendaftaran;
    }

    public function build()
    {
        return $this->subject('Soal Ujian Tulis Asesmen RPL Tersedia')
                    ->view('emails.ujian_tulis_tersedia');
    }
}
