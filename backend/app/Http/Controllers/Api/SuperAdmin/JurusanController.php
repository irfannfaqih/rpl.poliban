<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Jurusan;
use Illuminate\Http\Request;

class JurusanController extends Controller
{
    public function index()
    {
        $jurusans = Jurusan::orderBy('nama_jurusan')->get();
        return response()->json(['data' => $jurusans]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_jurusan' => 'required|string|max:255|unique:jurusan,nama_jurusan',
        ]);

        $jurusan = Jurusan::create($validated);
        return response()->json(['data' => $jurusan, 'message' => 'Jurusan berhasil ditambahkan'], 201);
    }

    public function show(string $id)
    {
        $jurusan = Jurusan::findOrFail($id);
        return response()->json(['data' => $jurusan]);
    }

    public function update(Request $request, string $id)
    {
        $jurusan = Jurusan::findOrFail($id);
        $validated = $request->validate([
            'nama_jurusan' => 'required|string|max:255|unique:jurusan,nama_jurusan,' . $id,
        ]);

        $jurusan->update($validated);
        return response()->json(['data' => $jurusan, 'message' => 'Jurusan berhasil diperbarui']);
    }

    public function destroy(string $id)
    {
        $jurusan = Jurusan::findOrFail($id);
        
        // Cek jika masih dipakai
        if ($jurusan->prodi()->count() > 0) {
            return response()->json(['message' => 'Jurusan tidak dapat dihapus karena masih digunakan oleh prodi'], 400);
        }

        $jurusan->delete();
        return response()->json(['message' => 'Jurusan berhasil dihapus']);
    }
}
