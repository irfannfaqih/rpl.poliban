<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class PenugasanAsesorMail extends QueuedMailable
{
    use Queueable, SerializesModels;

    public $asesor;
    public $pendaftaran;

    public function __construct($asesor, $pendaftaran)
    {
        $this->asesor = $asesor;
        $this->pendaftaran = $pendaftaran;
    }

    public function build()
    {
        return $this->subject('Penugasan Asesmen RPL - ' . ($this->pendaftaran->user->nama ?? 'SIRPL Poliban'))
                    ->view('emails.penugasan_asesor');
    }
}
