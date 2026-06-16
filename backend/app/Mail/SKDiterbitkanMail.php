<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class SKDiterbitkanMail extends QueuedMailable
{
    use Queueable, SerializesModels;

    public $pendaftaran;
    public $sk;

    public function __construct($pendaftaran, $sk)
    {
        $this->pendaftaran = $pendaftaran;
        $this->sk = $sk;
    }

    public function build()
    {
        return $this->subject('Pengumuman Hasil RPL & SK Keputusan - SIRPL Poliban')
                    ->view('emails.sk_diterbitkan');
    }
}
