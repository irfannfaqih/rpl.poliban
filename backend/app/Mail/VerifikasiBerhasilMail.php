<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class VerifikasiBerhasilMail extends QueuedMailable
{
    use Queueable, SerializesModels;

    public $pendaftaran;

    public function __construct($pendaftaran)
    {
        $this->pendaftaran = $pendaftaran;
    }

    public function build()
    {
        return $this->subject('Verifikasi Berkas RPL Valid')
                    ->view('emails.verifikasi_berhasil');
    }
}
