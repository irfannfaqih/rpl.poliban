<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borang_drafts', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('pendaftaran_id')->unique();
            $table->unsignedInteger('user_id');
            $table->json('payload');
            $table->timestamp('last_saved_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->foreign('pendaftaran_id')->references('id')->on('pendaftaran')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borang_drafts');
    }
};
