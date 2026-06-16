<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class VerifikasiBerkasMail extends QueuedMailable
{
    use Queueable, SerializesModels;

    public $pendaftaran;
    public $catatan;

    public function __construct($pendaftaran, $catatan)
    {
        $this->pendaftaran = $pendaftaran;
        $this->catatan = $catatan;
    }

    public function build()
    {
        return $this->subject('Notifikasi Berkas RPL Anda Dikembalikan - SIRPL Poliban')
                    ->view('emails.verifikasi_dikembalikan');
    }
}
