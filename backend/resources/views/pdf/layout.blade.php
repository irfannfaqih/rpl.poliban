<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Dokumen RPL')</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11px;
            
            line-height: 1.4;
            margin: 0;
            padding: 20px;
        }
        
        .kop-surat {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .kop-surat table {
            width: 100%;
            border: none;
        }

        .kop-surat td {
            border: none;
            padding: 0;
        }

        .logo {
            width: 80px;
            height: auto;
        }

        .kop-teks {
            text-align: center;
        }

        .kop-teks h2, .kop-teks h3, .kop-teks p {
            margin: 0;
            padding: 2px 0;
        }

        .kop-teks h2 {
            font-size: 16px;
            text-transform: uppercase;
        }

        .kop-teks h3 {
            font-size: 14px;
        }

        .kop-teks p {
            font-size: 10px;
        }

        h4.doc-title {
            text-align: center;
            font-size: 14px;
            margin: 20px 0;
            text-transform: uppercase;
            
        }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        table.data-table th, table.data-table td {
            border: 1px solid #666;
            padding: 6px 8px;
            vertical-align: top;
        }

        table.data-table th {
            
            text-align: left;
            font-weight: bold;
        }

        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            
            padding: 5px;
            border-left: 4px solid #333;
        }

        .signature-box {
            width: 300px;
            float: right;
            margin-top: 40px;
            text-align: center;
        }

        .signature-box p {
            margin: 0 0 70px 0;
        }

        .clear {
            clear: both;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>

    <div class="kop-surat">
        <table>
            <tr>
                <td width="15%" style="text-align: left;">
                    @php
                        // Gunakan $imageData dari PdfService jika sudah di-pass (cached)
                        // Fallback: baca dari disk (untuk render langsung tanpa service)
                        if (!isset($imageData) || !$imageData) {
                            $imagePath = public_path('img/poliban-pdf.png');
                            $imageData = file_exists($imagePath)
                                ? base64_encode(file_get_contents($imagePath))
                                : '';
                        }
                    @endphp
                    @if($imageData)
                        <img src="data:image/png;base64,{{ $imageData }}" class="logo" alt="Logo Poliban">
                    @endif
                </td>
                <td width="85%" class="kop-teks">
                    <h3>KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h3>
                    <h2>POLITEKNIK NEGERI BANJARMASIN</h2>
                    <p>Jl. Brigjend H. Hasan Basri, Kayu Tangi, Banjarmasin 70123</p>
                    <p>Telepon (0511) 3305052, 3307757 | Fax. (0511) 3301281</p>
                    <p>Website: www.poliban.ac.id | Email: info@poliban.ac.id</p>
                </td>
            </tr>
        </table>
    </div>

    @yield('content')

</body>
</html>


